'use strict';
const worker_threads = require('worker_threads');
const path = require('path');
const msgTypes = require('./msgTypes');

let lookupWorker;

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

function removeItemFromRequireCache(item) {
  delete require.cache[require.resolve(item)];
}

class LookupWorker {
  constructor(serverCom) {
    /**
     * @type {worker_threads.MessagePort}
     */
    this.serverCom = serverCom;

    /**
     * @type {string}
     */
    this.mdataPath = worker_threads.workerData.mdataPath;

    /**
     * @type {string}
     */
    this.behaviorDir = worker_threads.workerData.behaviorDir;

    /**
     * @type {?Array<Object>}
     */
    this.behaviors = null;

    /**
     * @type {?Object}
     */
    this.defaultBehavior = null;

    this.onMsg = this.onMsg.bind(this);
    this.serverCom.on('message', this.onMsg);
    this._loadBehaviorMdata();
  }

  onMsg(msg) {
    switch (msg.type) {
      case msgTypes.reloadBehaviors:
        return this.reloadBehaviors(msg);
      case msgTypes.lookupBehavior:
        return this.lookupBehavior(msg);
      case msgTypes.lookupBehaviorInfo:
        return this.lookupBehaviorInfo(msg);
      case msgTypes.shutdown:
        if (this.serverCom) {
          this.serverCom.close();
        }
        break;
    }
  }

  findBehavior(msg) {
    let behaviorIdx = this.behaviors.length;
    while (behaviorIdx--) {
      if (behaviorMatches(msg.url, this.behaviors[behaviorIdx].match)) {
        return this.behaviors[behaviorIdx];
      }
    }
    return this.defaultBehavior;
  }

  async lookupBehavior(msg) {
    const results = {
      behavior: null,
      wasError: false,
      errorMsg: null
    };
    try {
      const foundBehavior = this.findBehavior(msg);
      results.behavior = path.join(this.behaviorDir, foundBehavior.name);
    } catch (error) {
      results.wasError = true;
      results.errorMsg = error.message;
    }
    this.serverCom.postMessage({
      type: msgTypes.behaviorLookupResults,
      id: msg.id,
      results
    });
  }

  async lookupBehaviorInfo(msg) {
    const results = {
      behavior: null,
      wasError: false,
      errorMsg: null
    };
    try {
      const foundBehavior = this.findBehavior(msg);
      results.behavior = {
        name: foundBehavior.name,
        description: foundBehavior.description,
        defaultBehavior: foundBehavior.defaultBehavior || false
      };
    } catch (error) {
      results.wasError = true;
      results.errorMsg = error.message;
    }
    this.serverCom.postMessage({
      type: msgTypes.behaviorLookupResults,
      id: msg.id,
      results
    });
  }

  reloadBehaviors(msg) {
    removeItemFromRequireCache(this.mdataPath);
    this._loadBehaviorMdata();
    const results = {
      reloadResults: {
        defaultBehavior: this.defaultBehavior.name,
        numBehaviors: this.behaviors.length
      },
      wasError: false,
      errorMsg: null
    };
    this.serverCom.postMessage({
      type: msgTypes.reloadBehaviorsResults,
      id: msg.id,
      results
    });
  }

  _loadBehaviorMdata() {
    const mdata = require(this.mdataPath);
    this.behaviors = mdata.behaviors;
    this.defaultBehavior = mdata.defaultBehavior;
  }
}

worker_threads.parentPort.once('message', msg => {
  lookupWorker = new LookupWorker(msg.serverCom);
});
