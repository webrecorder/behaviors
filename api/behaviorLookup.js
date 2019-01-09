'use strict';
const path = require('path');
const { Worker, MessageChannel } = require('worker_threads');
const fp = require('fastify-plugin');
const uuid = require('uuid/v4');
const msgTypes = require('./msgTypes');

function noop() {}

class BehaviorLookUp {
  /**
   *
   * @param {Object} conf
   */
  constructor(conf) {
    /**
     * @type {Object}
     */
    this.conf = conf;

    /**
     * @type {Map<string, {resolve: function(arg: any), reject: function(arg: Error)}>}
     */
    this.msgIdsToPromises = new Map();
    this.channel = new MessageChannel();
    this._isRealShutdown = false;
    this.worker = new Worker(path.join(__dirname, 'lookupWorker.js'), {
      workerData: this.conf.behaviorInfo
    });
    this.worker.on('error', error => {
      console.log('lookupBehavior worker in countered an error', error);
    });
    this.worker.on('exit', code => {
      if (!this._isRealShutdown) {
        console.log('lookupBehavior worker exited', code);
      }
    });
    this.worker.postMessage({ serverCom: this.channel.port1 }, [
      this.channel.port1
    ]);
    this.channel.port2.on('message', this.onWorkerMsg.bind(this));
    this.lookupBehavior = this.lookupBehavior.bind(this);
    this.lookupBehaviorInfo = this.lookupBehaviorInfo.bind(this);
    this.reloadBehaviors = this.reloadBehaviors.bind(this);
  }

  onWorkerMsg(msg) {
    const lookupProm = this.msgIdsToPromises.get(msg.id);
    if (lookupProm) {
      if (!msg.results.wasError) {
        switch (msg.type) {
          case msgTypes.behaviorLookupResults:
            lookupProm.resolve(msg.results.behavior);
            break;
          case msgTypes.reloadBehaviorsResults:
            lookupProm.resolve(msg.results.reloadResults);
            break;
        }
      } else {
        lookupProm.reject(new Error(msg.results.errorMsg));
      }
      this.msgIdsToPromises.delete(msg.id);
    }
  }

  /**
   *
   * @param url
   * @return {Promise<string>}
   */
  lookupBehavior(url) {
    return this._sendMsg(msgTypes.lookupBehavior, url);
  }

  /**
   *
   * @param url
   * @return {Promise<Object>}
   */
  lookupBehaviorInfo(url) {
    return this._sendMsg(msgTypes.lookupBehaviorInfo, url);
  }

  /**
   *
   * @return {Promise<Object>}
   */
  reloadBehaviors() {
    return this._sendMsg(msgTypes.reloadBehaviors);
  }

  terminate(done) {
    this._isRealShutdown = true;
    this.worker.terminate(done || noop);
  }

  _sendMsg(type, url) {
    const msgId = uuid();
    const resolveRejects = { resolve: null, reject: null };
    const prom = new Promise((resolve, reject) => {
      resolveRejects.resolve = resolve;
      resolveRejects.reject = reject;
    });
    this.msgIdsToPromises.set(msgId, resolveRejects);
    this.channel.port2.postMessage({
      type,
      id: msgId,
      url
    });
    return prom;
  }
}
/**
 *
 * @param {fastify.FastifyInstance} server
 * @param opts
 * @param pluginNext
 */
function behaviorLookup(server, opts, pluginNext) {
  const behaviorLookerUpper = new BehaviorLookUp(server.conf);
  server.decorate('behaviorLookUp', behaviorLookerUpper);
  server.decorate(
    'lookupBehavior',
    behaviorLookerUpper.lookupBehavior
  );
  server.decorate(
    'lookupBehaviorInfo',
    behaviorLookerUpper.lookupBehaviorInfo
  );
  server.decorate(
    'reloadBehaviors',
    behaviorLookerUpper.reloadBehaviors
  );
  server.ready(() => {
    server.gracefulShutdown((signal, next) => {
      behaviorLookerUpper.terminate(next);
    });
  });
  pluginNext();
}

module.exports = fp(behaviorLookup);

