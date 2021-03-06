'use strict';
const path = require('path');
const { Worker, MessageChannel } = require('worker_threads');
const uuid = require('uuid/v4');
const EventEmitter = require('eventemitter3');
const msgTypes = require('./msgTypes');
const { autobind } = require('./utils');

/**
 * @typedef {Object} LookupWorkerConfig
 * @property {string} workerPath - The path to worker's JS file
 * @property {number} id - The id of the worker
 * @property {Object} behaviorInfo - The behavior info to be sent to the worker
 */

/**
 * A simple no operation function
 */
function noop() {}

/**
 * The events emitted by a LookupWorker instance
 * @type {{exit: symbol, error: symbol, message: symbol}}
 */
const WorkerEvents = {
  error: Symbol('worker-error'),
  exit: Symbol('worker-exit'),
  message: Symbol('worker-message'),
};

/**
 * Returns an object that allows for the control of promise to be done
 * externally, that is to say not within the executor
 * @return {{resolve: Function, promise: Promise, reject: Function}}
 */
function promiseResolveReject() {
  const prr = {};
  prr.promise = new Promise((resolve, reject) => {
    prr.resolve = resolve;
    prr.reject = reject;
  });
  return prr;
}

/**
 * Returns the first element in an array
 * @param {Array<*>} ar - An array of elements
 * @return {*}
 */
const arrayFirstElement = ar => ar[0];

/**
 * A thin wrapper around node worker threads
 * @emits {WorkerEvents.message} A message from the backing worker was received
 * @emits {WorkerEvents.exit} The backing worker exited
 * @emits {WorkerEvents.error} The backing worker threw an error
 */
class LookupWorker extends EventEmitter {
  /**
   * Construct a new LookupWorker instance
   * @param {LookupWorkerConfig} config - The lookup worker configuration
   */
  constructor(config) {
    super();
    /**
     * @type {number}
     */
    this.id = config.id;

    /**
     * @type {Object}
     */
    this.behaviorInfo = config.behaviorInfo;

    /**
     * @type {string}
     */
    this.workerPath = config.workerPath;

    /**
     * @type {boolean}
     * @private
     */
    this._isRealShutdown = false;

    /**
     *
     * @type {?MessageChannel}
     * @private
     */
    this._channel = null;

    /**
     * @type {?Worker}
     * @private
     */
    this._worker = null;

    /**
     * @type {?{resolve: Function, promise: Promise, reject: Function}}
     * @private
     */
    this._terminationPromise = null;
    autobind(this);
  }

  /**
   * Initialize the lookup worker
   */
  init() {
    this._channel = new MessageChannel();
    this._worker = new Worker(this.workerPath, {
      workerData: {
        workerId: this.id,
        behaviorInfo: this.behaviorInfo,
      },
    });
    this._worker.postMessage({ serverCom: this._channel.port1 }, [
      this._channel.port1,
    ]);
    this._channel.port2.on('message', this._onWorkerMsg);
    this._worker.on('error', this._onWorkerError);
    this._worker.on('exit', this._onWorkerExit);
  }

  /**
   * Sends a message to the backing worker
   * @param {*} msg - The message to be sent
   */
  sendMsg(msg) {
    this._channel.port2.postMessage(msg);
  }

  /**
   * Terminates the lookup worker
   * @return {Promise}
   */
  terminate() {
    if (this._isRealShutdown) return this._terminationPromise.promise;
    this._isRealShutdown = true;
    this._terminationPromise = promiseResolveReject();
    this._worker.terminate();
    return this._terminationPromise.promise;
  }

  /**
   * Listener for worker error event
   * @param {Error} error
   * @private
   */
  _onWorkerError(error) {
    this.emit(WorkerEvents.error, { id: this.id, error });
  }

  /**
   * Listener for the worker exit event
   * @param {number} code
   * @private
   */
  _onWorkerExit(code) {
    if (this._terminationPromise) {
      this._terminationPromise.resolve();
    }
    this.emit(WorkerEvents.exit, { id: this.id, code });
  }

  /**
   * Listener for the worker message event
   * @param {Object} msg
   * @private
   */
  _onWorkerMsg(msg) {
    this.emit(WorkerEvents.message, msg);
  }
}

/**
 * Class that manages the behavior lookup workers, sending lookup messages to
 * each worker in a round robin fashion.
 */
class BehaviorLookUp {
  /**
   * Create new instance of the BehaviorLookUp class
   * @param {Object} conf
   */
  constructor(conf) {
    /**
     * @type {Object}
     */
    this.conf = conf;

    /**
     * @type {number}
     * @private
     */
    this._numWorkers = conf.numLookupWorkers;

    /**
     * @type {number}
     * @private
     */
    this._lastWorkerId = -1;

    /**
     * @type {boolean}
     * @private
     */
    this._isRealShutdown = false;

    /**
     * @type {Map<number, LookupWorker>}
     */
    this._workersById = new Map();

    /**
     * @type {Map<string, {resolve: function, reject: function}>}
     */
    this._msgIdsToPromises = new Map();

    autobind(this);
  }

  /**
   * Initialize the behavior lookup manager
   */
  init() {
    const workerPath = path.join(__dirname, 'lookupWorker.js');
    const behaviorInfo = this.conf.behaviorInfo;
    for (let workerId = 0; workerId < this._numWorkers; workerId++) {
      const worker = new LookupWorker({
        behaviorInfo,
        id: workerId,
        workerPath,
      });
      worker.init();
      worker.on(WorkerEvents.error, this._onLookupWorkerError);
      worker.on(WorkerEvents.exit, this._onLookupWorkerExit);
      worker.on(WorkerEvents.message, this._onLookupWorkerMsg);
      this._workersById.set(workerId, worker);
    }
  }

  /**
   * Returns the id of the next worker to send a message to in a round robin
   * fashion.
   * @return {number}
   */
  nextWorkerId() {
    let nextWorkerId = this._lastWorkerId + 1;
    if (nextWorkerId >= this._numWorkers) {
      nextWorkerId = 0;
    }
    this._lastWorkerId = nextWorkerId;
    return nextWorkerId;
  }

  /**
   * Initiates a behavior lookup action returning, a promise containing the
   * results of this action that resolves once the results of this action have
   * been received
   * @param {Object} request - The request initiating this action
   * @return {Promise<string>}
   */
  lookupBehavior(request) {
    return this._sendMsg(msgTypes.lookupBehavior, request.query);
  }

  /**
   * Initiates a behavior info lookup action, returning a promise containing the
   * results of this action that resolves once the results of this action have
   * been received
   * @param {Object} request - The request initiating this action
   * @return {Promise<Object>}
   */
  info(request) {
    return this._sendMsg(msgTypes.lookupBehaviorInfo, request.query);
  }

  /**
   * Initiates a behavior info lookup action, returning a promise containing the
   * results of this action that resolves once the results of this action have
   * been received
   * @param {Object} request - The request initiating this action
   * @return {Promise<Object>}
   */
  infoList(request) {
    return this._sendMsg(msgTypes.behaviorList, request.query);
  }

  /**
   * Initiates a behavior info lookup action, returning a promise containing the
   * results of this action that resolves once the results of this action have
   * been received
   * @return {Promise<Object>}
   */
  allInfo() {
    return this._sendMsg(msgTypes.lookupBehaviorInfoAll);
  }

  /**
   * Sends the reload behaviors message to all backing workers, returning a
   * promise containing the results of this action that resolves once the
   * results of this action have been received
   * @return {Promise<Object>}
   */
  reloadBehaviors() {
    const reloadResponses = new Array(this._numWorkers);
    for (let workerId = 0; workerId < this._numWorkers; workerId++) {
      reloadResponses[workerId] = this._sendDirectMessage(workerId, {
        type: msgTypes.reloadBehaviors,
      });
    }
    return Promise.all(reloadResponses).then(arrayFirstElement);
  }

  /**
   * Initiates shut down by terminating all workers, returning a promise that
   * resolves once all workers have been terminated.
   * @param {?Function} [done] - Optional callback called once shutdown is
   * complete
   */
  shutdown(done) {
    const doneCB = done ? done : noop;
    if (this._isRealShutdown) return doneCB();
    this._isRealShutdown = true;
    const terminationPromises = new Array(this._numWorkers);
    for (let workerId = 0; workerId < this._numWorkers; workerId++) {
      terminationPromises[workerId] = this._workersById
        .get(workerId)
        .terminate();
    }
    Promise.all(terminationPromises)
      .then(() => {
        this._workersById.clear();
        doneCB();
      })
      .catch(error => {
        doneCB();
      });
  }

  /**
   * Sends a message to a worker. The worker the message is sent to is
   * determined by {@link nextWorkerId}
   * @param {string} type - The type of the action to be performed
   * @param {Object} [query] - Optional query to be sent to worker
   * @return {Promise<Object|String>}
   * @private
   */
  _sendMsg(type, query) {
    const workerId = this.nextWorkerId();
    const msgId = uuid();
    const msg = { id: msgId, type, query };
    const prr = promiseResolveReject();
    this._msgIdsToPromises.set(msgId, prr);
    this._workersById.get(workerId).sendMsg(msg);
    return prr.promise;
  }

  /**
   * Sends a direct message to one of the backing workers
   * @param {number} workerId - The id of the worker the message is to be sent to
   * @param {Object} directMsg - The message to be sent
   * @return {Promise}
   * @private
   */
  _sendDirectMessage(workerId, directMsg) {
    const msgId = uuid();
    directMsg.id = msgId;
    const prr = promiseResolveReject();
    this._msgIdsToPromises.set(msgId, prr);
    this._workersById.get(workerId).sendMsg(directMsg);
    return prr.promise;
  }

  /**
   * Listener for lookup worker messages
   * @param {Object} msg - The message received from the worker
   * @private
   */
  _onLookupWorkerMsg(msg) {
    const lookupProm = this._msgIdsToPromises.get(msg.id);
    if (lookupProm) {
      if (!msg.wasError) {
        lookupProm.resolve(msg.results);
      } else {
        lookupProm.reject(new Error(msg.errorMsg));
      }
      this._msgIdsToPromises.delete(msg.id);
    }
  }

  /**
   * Listener for lookup worker errors
   * @param {{id: string, error: Error}} errorDetails
   * @private
   */
  _onLookupWorkerError({ id, error }) {
    console.log(`Lookup worker ${id} encountered an error`, error);
  }

  /**
   * Listener for lookup worker exiting
   * @param {{id:string, code: number}} exitDetails
   * @private
   */
  _onLookupWorkerExit({ id, code }) {
    console.log(`Lookup worker ${id} exited with code ${code}`);
  }
}

module.exports = BehaviorLookUp;
