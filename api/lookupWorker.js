'use strict';
const { parentPort, workerData, MessagePort } = require('worker_threads');
const path = require('path');
const util = require('util');
const msgTypes = require('./msgTypes');

console.log(
  `Lookup Worker starting with configuration\n${util.inspect(workerData, {
    depth: null,
    compact: false,
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
 * @param {Object} query - The URL to match to a behavior
 * @param {Object} behavior - A behavior
 * @return {boolean}
 */
function behaviorMatches(query, behavior) {
  if (query.name) {
    return query.name === behavior.name;
  }
  const match = behavior.match;
  const url = query.url;
  if (match.regex) {
    if (match.regex.base) {
      if (match.regex.base.test(url)) {
        const sub = match.regex.sub;
        for (let subIdx = 0; subIdx < sub.length; subIdx++) {
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
 * Loads the behavior metadata
 */
function loadBehaviorMdata() {
  behaviorMetadata = require(mdataPath);
}

/**
 * Simply creates the reply message object in order to simplify
 * the reply format
 * @param {Object} msg
 * @return {{workerId: number, wasError: boolean, id: string, results: *, errorMsg: ?string}}
 */
function createReplyObj(msg) {
  return {
    workerId,
    id: msg.id,
    results: null,
    wasError: false,
    errorMsg: null,
  };
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
    case msgTypes.lookupBehaviorInfoAll:
      return allBehaviorInfo(msg);
    case msgTypes.behaviorList:
      return behaviorList(msg);
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
 * @param {Object} query - The message sent to the LookupWorker from the
 * parent process
 * @return {Object}
 */
function findBehavior(query) {
  if (query.name && behaviorMetadata.defaultBehavior.name === query.name) {
    return behaviorMetadata.defaultBehavior;
  }
  const behaviors = behaviorMetadata.behaviors;
  for (let behaviorIdx = 0; behaviorIdx < behaviors.length; behaviorIdx++) {
    if (behaviorMatches(query, behaviors[behaviorIdx])) {
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
function lookupBehavior(msg) {
  const replyObj = createReplyObj(msg);
  try {
    const foundBehavior = findBehavior(msg.query);
    replyObj.results = path.join(behaviorDir, foundBehavior.fileName);
  } catch (error) {
    replyObj.wasError = true;
    replyObj.errorMsg = error.message;
  }
  serverCom.postMessage(replyObj);
}

/**
 * Performs the behavior info lookup action
 * @param {Object} msg - The message sent to the LookupWorker from the
 * parent process
 * @return {Promise<void>}
 */
function lookupBehaviorInfo(msg) {
  const replyObj = createReplyObj(msg);
  try {
    replyObj.results = findBehavior(msg.query);
  } catch (error) {
    replyObj.wasError = true;
    replyObj.errorMsg = error.message;
  }
  serverCom.postMessage(replyObj);
}

/**
 * Reloads the behaviors
 * @param {Object} msg - The message sent to the LookupWorker from the
 * parent process
 */
function reloadBehaviors(msg) {
  removeItemFromRequireCache(mdataPath);
  loadBehaviorMdata();
  const replyObj = createReplyObj(msg);
  replyObj.results = {
    defaultBehavior: behaviorMetadata.defaultBehavior.name,
    numBehaviors: behaviorMetadata.behaviors.length,
  };
  serverCom.postMessage(replyObj);
}

/**
 * Replies with the metadata of all behaviors
 * @param {Object} msg - The message sent to the LookupWorker from the
 * parent process
 */
function allBehaviorInfo(msg) {
  const replyObj = createReplyObj(msg);
  replyObj.results = behaviorMetadata;
  serverCom.postMessage(replyObj);
}

/**
 * Like {@link lookupBehaviorInfo} except that this function replies
 * with a list of matching behaviors (direct matches, default behavior)
 * @param {Object} msg - The message sent to the LookupWorker from the
 * parent process
 */
function behaviorList(msg) {
  const replyObj = createReplyObj(msg);
  try {
    const foundBehavior = findBehavior(msg.query);
    replyObj.results = foundBehavior.defaultBehavior
      ? [foundBehavior]
      : [foundBehavior, behaviorMetadata.defaultBehavior];
  } catch (error) {
    replyObj.wasError = true;
    replyObj.errorMsg = error.message;
  }
  serverCom.postMessage(replyObj);
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
