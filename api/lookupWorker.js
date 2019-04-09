'use strict';
const { parentPort, workerData, MessagePort } = require('worker_threads');
const path = require('path');
const util = require('util');
const msgTypes = require('./msgTypes');

console.log(
  `Lookup Worker starting with configuration\n${util.inspect(workerData, {
    depth: null,
    compact: false
  })}\n`
);

/**
 * @type {MessagePort}
 */
let serverCom;

/**
 * @type {Object}
 */
let behaviorMetadata;

/**
 * @type {string}
 */
const mdataPath = workerData.behaviorInfo.mdataPath;

/**
 * @type {string}
 */
const behaviorDir = workerData.behaviorInfo.behaviorDir;

/**
 * @type {number}
 */
const workerId = workerData.workerId;

/**
 * Returns T/F indicating if the supplied URL matches a behaviors match object
 * @param {string} url - The URL to match to a behavior
 * @param {Object} match - A behaviors match object
 * @return {boolean}
 */
function behaviorMatches(url, match) {
  if (match.regex) {
    if (match.regex.base) {
      if (match.regex.base.test(url)) {
        const sub = match.regex.sub;
        let subIdx = sub.length;
        while (subIdx--) {
          if (sub[subIdx].test(url)) return true;
        }
      }
    } else {
      return match.regex.test(url);
    }
  }
  return false;
}

/**
 * Removes the supplied item from the require cache
 * @param {string} item - The item to be removed from the require cache
 */
function removeItemFromRequireCache(item) {
  delete require.cache[require.resolve(item)];
}

/**
 * Sends a reply back to the parent process
 * @param {string} id - The id for the message this message is a response to
 * @param {string} type - The type of response message
 * @param {Object} results - The results of the action performed
 */
function reply(id, type, results) {
  serverCom.postMessage({ type, id, results, workerId });
}

/**
 * Loads the behavior metadata
 */
function loadBehaviorMdata() {
  behaviorMetadata = require(mdataPath);
}

/**
 * Handles messages sent to the LookupWorker from the parent process
 * @param {Object} msg - The message sent to the worker
 * from the parent process
 * @return {Promise<void>|void}
 */
function onMsg(msg) {
  switch (msg.type) {
    case msgTypes.reloadBehaviors:
      return reloadBehaviors(msg);
    case msgTypes.lookupBehavior:
      return lookupBehavior(msg);
    case msgTypes.lookupBehaviorInfo:
      return lookupBehaviorInfo(msg);
    case msgTypes.shutdown:
      if (serverCom) {
        serverCom.close();
      }
      break;
  }
}

/**
 * Attempts to find a matching behavior returning the matching behavior
 * if a match was made otherwise the default behavior
 * @param {Object} msg - The message sent to the LookupWorker from the
 * parent process
 * @return {Object}
 */
function findBehavior(msg) {
  const url = msg.url;
  const behaviors = behaviorMetadata.behaviors;
  let behaviorIdx = behaviors.length;
  while (behaviorIdx--) {
    if (behaviorMatches(url, behaviors[behaviorIdx].match)) {
      return behaviors[behaviorIdx];
    }
  }
  return behaviorMetadata.defaultBehavior;
}

/**
 * Performs the behavior lookup action
 * @param {Object} msg - The message sent to the LookupWorker from the
 * parent process
 * @return {Promise<void>}
 */
async function lookupBehavior(msg) {
  const results = {
    behavior: null,
    wasError: false,
    errorMsg: null
  };
  try {
    const foundBehavior = findBehavior(msg);
    results.behavior = path.join(behaviorDir, foundBehavior.fileName);
  } catch (error) {
    results.wasError = true;
    results.errorMsg = error.message;
  }
  reply(msg.id, msgTypes.behaviorLookupResults, results);
}

/**
 * Performs the behavior info lookup action
 * @param {Object} msg - The message sent to the LookupWorker from the
 * parent process
 * @return {Promise<void>}
 */
async function lookupBehaviorInfo(msg) {
  const results = {
    behavior: null,
    wasError: false,
    errorMsg: null
  };
  try {
    const foundBehavior = findBehavior(msg);
    results.behavior = {
      name: foundBehavior.name,
      description: foundBehavior.description,
      defaultBehavior: foundBehavior.defaultBehavior || false
    };
  } catch (error) {
    results.wasError = true;
    results.errorMsg = error.message;
  }
  reply(msg.id, msgTypes.behaviorLookupResults, results);
}

/**
 * Reloads the behaviors
 * @param {Object} msg - The message sent to the LookupWorker from the
 * parent process
 */
function reloadBehaviors(msg) {
  removeItemFromRequireCache(mdataPath);
  loadBehaviorMdata();
  const results = {
    reloadResults: {
      defaultBehavior: behaviorMetadata.defaultBehavior.name,
      numBehaviors: behaviorMetadata.behaviors.length
    },
    wasError: false,
    errorMsg: null
  };
  reply(msg.id, msgTypes.reloadBehaviorsResults, results);
}

parentPort.once('message', msg => {
  if (!(msg.serverCom instanceof MessagePort)) {
    throw new Error('The serverCom was not an instance of MessagePort!');
  }
  loadBehaviorMdata();
  /**
   * @type {MessagePort}
   */
  serverCom = msg.serverCom;
  serverCom.on('message', onMsg);
});
