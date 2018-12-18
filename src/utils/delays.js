import { qs, selectorExists } from './dom';


/** TODO
 * 
 *
 *
*/

export function setIntervalP(callback, timeout) {
  return setInterval(function() {
    if (!window.$WBBehaviorPaused) {
      callback();
    }
  }, timeout);
}



/** TODO
 * 
 *
 *
*/

export function setTimeoutP(callback, timeout) {
  function execIfNotPaused() {
    if (!window.$WBBehaviorPaused) {
      callback();
    } else {
      setTimeout(execIfNotPaused, 500);
    }
  }

  return setTimeout(execIfNotPaused, timeout);
}
  


/**
 * @param {number} [delayTime = 3000]
 * @returns {Promise<void>}
 */
export function delay(delayTime = 3000) {
  return new Promise(resolve => {
    setTimeout(resolve, delayTime);
  });
}

/**
 * @desc Returns a promise that resolves when the supplied predicate function
 * returns a truthy value. Polling via setInterval 1sec.
 * @param {function(): boolean} predicate
 * @return {Promise<void>}
 */
export function waitForPredicate(predicate) {
  return new Promise(resolve => {
    let int = setIntervalP(() => {
      if (predicate()) {
        clearInterval(int);
        resolve();
      }
    }, 1000);
  });
}

/**
 * @desc Returns a promise that resolves when the supplied predicate function
 * returns a truthy value. Polling via setInterval 1sec.
 * @param {function(): boolean} predicate
 * @param {number} time
 * @return {Promise<void>}
 */
export function waitForPredicateAtMax(predicate, time) {
  return new Promise(resolve => {
    let to = -1;
    let int = setIntervalP(() => {
      if (predicate()) {
        clearTimeout(to);
        clearInterval(int);
        resolve();
      }
    }, 1000);
    to = setTimeoutP(() => {
      clearInterval(int);
      resolve();
    }, time);
  });
}

/**
 * @desc Calls `fromNode.querySelector` using the supplied selector. If the
 * return value of the first calls is null/undefined then waits for the same call
 * to return a truthy value and then returns the element the selector matches.
 * @param {Element | Node | HTMLElement} fromNode
 * @param {string} selector
 * @return {Promise<Element | Node | HTMLElement>}
 */
export async function waitForAndSelectElement(fromNode, selector) {
  let elem = qs(selector, fromNode);
  if (!elem) {
    await waitForPredicate(() => selectorExists(selector));
    elem = qs(selector, fromNode);
  }
  return elem;
}

/**
 * @return {Promise<void>}
 */
export function domCompletePromise() {
  if (document.readyState !== 'complete') {
    return new Promise(r => {
      let i = setIntervalP(() => {
        if (document.readyState === 'complete') {
          clearInterval(i);
          r();
        }
      }, 1000);
    });
  }
  return Promise.resolve();
}

/**
 * @param {Element} parentElement
 * @param {number} currentChildCount
 * @param {{pollRate: number, max: number}} [opts]
 * @return {Promise<void>}
 */
export function waitForAdditionalElemChildren(
  parentElement,
  currentChildCount,
  opts
) {
  let pollRate = 1000;
  let max = 6;
  if (opts != null) {
    if (opts.pollRate != null) pollRate = opts.pollRate;
    if (opts.max != null) max = opts.max;
  }
  let n = 0;
  let int = -1;
  return new Promise(resolve => {
    int = setIntervalP(() => {
      if (!parentElement.isConnected) {
        clearInterval(int);
        return resolve();
      }
      if (
        parentElement.children &&
        parentElement.children.length > currentChildCount
      ) {
        clearInterval(int);
        return resolve();
      }
      if (n > max) {
        clearInterval(int);
        return resolve();
      }
      n += 1;
    }, pollRate);
  });
}
