import { qs, selectorExists } from './dom';
import { promiseResolveReject } from './general';

/**
 * @desc 1 second in milliseconds
 * @type {number}
 */
export const DelayAmount1Second = 1000;

/**
 * @desc 2the second in milliseconds
 * @type {number}
 */
export const DelayAmount2Seconds = 2000;

/**
 * @desc 3 second in milliseconds
 * @type {number}
 */
export const DelayAmount3Seconds = 3000;

/**
 * @desc 4 second in milliseconds
 * @type {number}
 */
export const DelayAmount4Seconds = 4000;

/**
 * @desc 5 second in milliseconds
 * @type {number}
 */
export const DelayAmount5Seconds = 5000;

/**
 * @desc Converts the supplied n number of seconds into milliseconds
 * which is required for setTimeout and setInterval
 * @param {number} n - The number of seconds to be delayed
 * @return {number} - The delay amount in milliseconds
 */
export function secondsToDelayAmount(n) {
  return n * 1000;
}

/**
 * @desc Returns a Promise that resolves once
 * the behavior has been un-paused
 * @return {Promise<any>}
 */
export function resolveWhenBehaviorUnPaused() {
  return new Promise(resolve => {
    let intervalId = setInterval(() => {
      if (!window.$WBBehaviorPaused) {
        clearInterval(intervalId);
        resolve();
      }
    }, 2000);
  });
}

/**
 * @desc Polls the supplied function at the timeout rate
 * only if the behavior is not paused
 * @return {number} - The id of the interval
 */
export function setIntervalP(callback, timeout) {
  return setInterval(function() {
    if (!window.$WBBehaviorPaused) {
      callback();
    }
  }, timeout);
}

/**
 * @desc Like setTimeout except that the timeout respects the pause state
 * of the behavior
 * @return {number} - The id of the timeout
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
 * @desc Returns a Promise that resolves after waiting the amount of time
 * specified by delayTime.
 * @param {number} [delayTime = 3000] - The length of the delay in milliseconds
 * @return {Promise<void>}
 */
export function delay(delayTime) {
  return new Promise(resolve => {
    setTimeout(resolve, delayTime || 3000);
  });
}

/**
 * @desc Returns a promise that resolves once the supplied predicate function
 * returns a truthy value.
 * @param {function(): boolean} predicate - A predicate function that
 * returns a truthy value to indicate the wait condition was satisfied otherwise
 * a falsy value to indicate wait condition not satisfied
 * @param {?WaitForOptions} [options] - Options controlling how the wait
 * will happen
 * @return {Promise<{predicate: boolean, maxExceeded: boolean}>}
 */
export function waitForPredicate(predicate, options) {
  if (options && options.max) {
    return waitForPredicateAtMax(predicate, options);
  }
  const opts = Object.assign({ pollRate: 1000 }, options);
  return new Promise(resolve => {
    let int = setInterval(() => {
      if (predicate()) {
        clearInterval(int);
        resolve({ maxExceeded: false, predicate: true });
      }
    }, opts.pollRate);
  });
}

/**
 * @desc Returns a promise that resolves when the supplied predicate function
 * returns a truthy value or the maximum wait time has been reached.
 * @param {function(): boolean} predicate - A predicate function that
 * returns a truthy value to indicate the wait condition was satisfied otherwise
 * a falsy value to indicate wait condition not satisfied
 * @param {?WaitForOptions|number} options - Either a
 * number (time in milliseconds) representing the maximum wait time for the
 * supplied predicate to return a truthy value or an object with properties
 * pollRate (optional, controls the interval rate the supplied predicate will be polled
 * at), max (how long to wait for the supplied predicate to return a truthy value)
 * @return {Promise<{predicate: boolean, maxExceeded: boolean}>}
 */
export function waitForPredicateAtMax(predicate, options) {
  const opts = Object.assign(
    { pollRate: 1000 },
    typeof options === 'number' ? { max: options } : options
  );
  return new Promise(resolve => {
    let to = -1;
    let int = setInterval(() => {
      if (predicate()) {
        clearTimeout(to);
        clearInterval(int);
        resolve({ maxReached: false, result: true });
      }
    }, opts.pollRate);
    to = setTimeout(() => {
      clearInterval(int);
      resolve({ maxExceeded: false, predicate: predicate() });
    }, opts.max);
  });
}

/**
 * @desc Calls `fromNode.querySelector` using the supplied selector. If the
 * return value of the first calls is null/undefined then waits for the same call
 * to return a truthy value and then returns the element the selector matches.
 * @param {SomeElement} fromNode - The element the
 * to select `selector` from
 * @param {string} selector - The querySelector to use for `fromNode.querySelector`
 * call.
 * @param {?WaitForOptions} [options] - Options controlling the
 * @return {Promise<?SomeElement>}
 */
export async function waitForAndSelectElement(fromNode, selector, options) {
  const opts = Object.assign(
    { pollRate: 1000 },
    typeof options === 'number' ? { max: options } : options
  );
  const elem = qs(selector, fromNode);
  if (!elem) {
    const waitRet = await waitForPredicate(
      () => selectorExists(selector, fromNode),
      opts
    );
    if (waitRet.predicate) return qs(selector, fromNode);
    return null;
  }
  return elem;
}

/**
 * @desc Returns a promise that resolves once
 * `document.readyState === 'complete'`
 * @return {Promise<void>}
 */
export function domCompletePromise() {
  if (document.readyState !== 'complete') {
    return new Promise(r => {
      let i = setInterval(() => {
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
 * @desc Waits for the number children of the supplied parentElement
 * to become greater than the supplied `currentChildCount`
 * @param {Element} parentElement - The parent
 * @param {number} currentChildCount
 * @param {WaitForOptions} [options]
 * @return {Promise<{predicate: boolean, maxExceeded: boolean}>}
 */
export function waitForAdditionalElemChildren(
  parentElement,
  currentChildCount,
  options
) {
  const opts = Object.assign({ pollRate: 1000, max: 15000 }, options);
  let int = -1;
  let safety = -1;
  const results = { predicate: false, maxExceeded: false };
  return new Promise(resolve => {
    int = setInterval(() => {
      if (!parentElement.isConnected) {
        clearInterval(int);
        if (safety) clearTimeout(safety);
        return resolve(results);
      }
      if (opts.guard && opts.guard()) {
        clearInterval(int);
        if (safety) clearTimeout(safety);
        return resolve(results);
      }
      if (parentElement.childElementCount > currentChildCount) {
        clearInterval(int);
        if (safety) clearTimeout(safety);
        results.predicate = true;
        return resolve(results);
      }
    }, opts.pollRate);
    if (opts.max !== -1) {
      safety = setTimeout(() => {
        clearInterval(int);
        results.predicate = (
          parentElement.childElementCount > currentChildCount
        );
        results.maxExceeded = true;
        resolve(results);
      }, opts.max);
    }
  });
}

/**
 * @desc Waits for additional child elements to be added to the
 * supplied parentElement using a mutation observer
 * @param {Element} parentElement - The parent
 * @param {GuardedWaitForOptions} [options]
 * @return {Promise<{predicate: boolean, maxExceeded: boolean}>}
 */
export function waitForAdditionalElemChildrenMO(parentElement, options) {
  const { guard, max = 15000, pollRate = 1000 } = options || {};
  let maxTo = -1;
  let pollIn = -1;
  const results = { predicate: false, maxExceeded: false };
  const prr = promiseResolveReject();
  let mutatationObz;
  const observer = () => {
    if (maxTo !== -1) clearTimeout(maxTo);
    if (pollIn !== -1) clearInterval(pollIn);
    results.predicate = true;
    if (mutatationObz) {
      mutatationObz.disconnect();
    }
    prr.resolve(results);
  };
  if (guard && guard()) {
    results.predicate = true;
    prr.resolve(results);
    return prr.promise;
  }
  mutatationObz = new MutationObserver(observer);
  mutatationObz.observe(parentElement, { childList: true });
  if (guard) {
    pollIn = setInterval(() => {
      if (guard()) {
        observer();
      }
    }, pollRate);
  }
  if (max !== -1) {
    maxTo = setTimeout(() => {
      if (pollIn !== -1) clearInterval(pollIn);
      results.maxExceeded = true;
      mutatationObz.disconnect();
      prr.resolve(results);
    }, max);
  }
  return prr.promise;
}

/**
 * @typedef {Object} WaitForOptions
 * @property {number} [pollRate = 1000] - The rate at which the condition will be checked
 * @property {?number} [max] - The maximum length of time the polling will happen in milliseconds
 */

/**
 * @typedef {Object} GuardedWaitForOptions
 * @property {function(): boolean} [guard] - Function polled to determine if the wait
 * is considered done by additional conditions
 * @property {number} [pollRate = 1000] - The rate at which the condition will be checked
 * @property {?number} [max] - The maximum length of time the polling will happen in milliseconds
 */
