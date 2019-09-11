import { isElemVisible, qs, selectorExists } from './dom';
import { promiseResolveReject } from './general';

/**
 * 1 second in milliseconds
 * @type {number}
 */
export const DelayAmount1Second = 1000;

/**
 * 2the second in milliseconds
 * @type {number}
 */
export const DelayAmount2Seconds = 2000;

/**
 * 3 second in milliseconds
 * @type {number}
 */
export const DelayAmount3Seconds = 3000;

/**
 * 4 second in milliseconds
 * @type {number}
 */
export const DelayAmount4Seconds = 4000;

/**
 * 5 second in milliseconds
 * @type {number}
 */
export const DelayAmount5Seconds = 5000;

/**
 * Converts the supplied n number of seconds into milliseconds
 * which is required for setTimeout and setInterval
 * @param {number} n - The number of seconds to be delayed
 * @return {number} - The delay amount in milliseconds
 */
export function secondsToDelayAmount(n) {
  return n * 1000;
}

/**
 * Returns a Promise that resolves once
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
 * Polls the supplied function at the timeout rate
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
 * Like setTimeout except that the timeout respects the pause state
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
 * Returns a Promise that resolves after waiting the amount of time
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
 * Returns a promise that resolves once the supplied predicate function
 * returns a truthy value.
 * @param {function(): boolean} predicate - A predicate function that
 * returns a truthy value to indicate the wait condition was satisfied otherwise
 * a falsy value to indicate wait condition not satisfied
 * @param {?WaitForOptions} [options] - Options controlling how the wait
 * will happen
 * @return {Promise<WaitResult>}
 */
export function waitForPredicate(predicate, options) {
  const opts = Object.assign({ pollRate: 1000 }, options);
  const results = { maxExceeded: false, predicate: false };
  let maxTo;
  return new Promise(resolve => {
    if (predicate()) {
      results.predicate = true;
      return resolve(results);
    }
    let int = setInterval(() => {
      if (predicate()) {
        results.predicate = true;
        clearInterval(int);
        if (maxTo) clearTimeout(maxTo);
        resolve(results);
      }
    }, opts.pollRate);
    if (opts.max && opts.max !== -1) {
      maxTo = setTimeout(() => {
        results.predicate = predicate();
        results.maxExceeded = true;
        clearInterval(int);
        resolve(results);
      }, opts.max);
    }
  });
}

/**
 * Calls `fromNode.querySelector` using the supplied selector. If the
 * return value of the first calls is null/undefined then waits for the same call
 * to return a truthy value and then returns the element the selector matches.
 * @param {SomeElement} fromNode - The element the to be selected `selector` from
 * @param {string} selector - The querySelector to use for `fromNode.querySelector`
 * call.
 * @param {?WaitForOptions} [options] - Options controlling the wait
 * @return {Promise<?SomeElement>}
 */
export async function waitForAndSelectElement(fromNode, selector, options) {
  const elem = qs(selector, fromNode);
  if (!elem) {
    const waitRet = await waitForPredicate(
      () => selectorExists(selector, fromNode),
      options
    );
    if (waitRet.predicate) return qs(selector, fromNode);
    return null;
  }
  return elem;
}

/**
 * Returns a promise that resolves once
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
 * Waits for the number children of the supplied parentElement
 * to become greater than the supplied parent elements `currentChildCount`.
 *
 * __Configuration__
 *
 * If a `max` is supplied (defaults to 15 seconds) the wait for additional children
 * to be added will not exceed the configured `max` value unless `max = -1`,
 * which in this case, the wait is infinite.
 *
 * When a `guard` function is supplied it is polled at value of `pollRate`
 * (defaults to 1 second), if and when it returns true the wait is considered
 * done regardless if the supplied parent element had additional children
 * added to it.
 *
 * @param {SomeElement} parentElement - The parent element
 * @param {WaitForOptions} [options] - Options controlling the wait
 * @return {Promise<WaitResult>}
 */
export function waitForAdditionalElemChildren(parentElement, options) {
  const opts = Object.assign({ pollRate: 1000, max: 15000 }, options);
  let int;
  let safety;
  const currentChildCount = parentElement.childElementCount;
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
        results.predicate = parentElement.childElementCount > currentChildCount;
        results.maxExceeded = true;
        resolve(results);
      }, opts.max);
    }
  });
}

/**
 * Waits for additional child elements to be added to the supplied parentElement
 * using a mutation observer.
 *
 * __Configuration__
 *
 * If a `max` is supplied (defaults to 15 seconds) the wait for additional children
 * to be added will not exceed the configured `max` value unless `max = -1`,
 * which in this case, the wait is infinite.
 *
 * When a `guard` function is supplied it is polled at value of `pollRate`
 * (defaults to 1 second), if and when it returns true the wait is considered
 * done regardless if the supplied parent element had additional children
 * added to it.
 *
 * @param {SomeElement} parentElement - The parent element
 * @param {GuardedWaitForOptions} [options] - Options controlling the wait
 * @return {Promise<WaitResult>}
 */
export function waitForAdditionalElemChildrenMO(parentElement, options) {
  const opts = Object.assign({ pollRate: 1000, max: 15000 }, options);
  let maxTo;
  let pollIn;
  const results = { predicate: false, maxExceeded: false };
  const prr = promiseResolveReject();
  let mutatationObz;
  const observer = () => {
    if (maxTo) clearTimeout(maxTo);
    if (pollIn) clearInterval(pollIn);
    results.predicate = true;
    if (mutatationObz) {
      mutatationObz.disconnect();
    }
    prr.resolve(results);
  };
  if (opts.guard && opts.guard()) {
    results.predicate = true;
    prr.resolve(results);
    return prr.promise;
  }
  mutatationObz = new MutationObserver(observer);
  mutatationObz.observe(parentElement, { childList: true });
  if (opts.guard) {
    pollIn = setInterval(() => {
      if (opts.guard()) {
        observer();
      }
    }, opts.pollRate);
  }
  if (opts.max !== -1) {
    maxTo = setTimeout(() => {
      if (pollIn !== -1) clearInterval(pollIn);
      results.maxExceeded = true;
      mutatationObz.disconnect();
      prr.resolve(results);
    }, opts.max);
  }
  return prr.promise;
}

/**
 * Waits for the supplied element to be removed from the document.
 * The condition, element removed from document, is polled at the configured
 * `pollRate` (defaults to 1 second) for a maximum of `max` time (defaults to 15 seconds)
 * unless `max = -1` which in this case there is no maximum.
 * @param {SomeElement} elem - The element that should be removed
 * @param {WaitForOptions} [options] - Options controlling the wait
 * @return {Promise<WaitResult>}
 */
export function waitUntilElementIsRemovedFromDom(elem, options) {
  const results = { predicate: false, maxExceeded: false };
  const opts = Object.assign({ pollRate: 1000, max: 15000 }, options);
  return new Promise(resolve => {
    if (!elem.isConnected) {
      results.predicate = true;
      return resolve(results);
    }
    let safety;
    const poll = setInterval(() => {
      if (!elem.isConnected) {
        if (safety) clearTimeout(safety);
        clearInterval(poll);
        results.predicate = true;
        return resolve(results);
      }
    }, opts.pollRate);
    if (opts.max !== -1) {
      safety = setTimeout(() => {
        clearInterval(poll);
        results.predicate = !elem.isConnected;
        results.maxExceeded = true;
        resolve(results);
      }, opts.max);
    }
  });
}

/**
 * Waits for the supplied selector to exist
 * @param {WaitForSelectorOptions} config - Options controlling the wait
 * @return {Promise<WaitResult>}
 */
export function waitForSelector({ selector, cntx, options }) {
  return waitForPredicate(() => selectorExists(selector, cntx), options);
}

/**
 * Waits for the supplied element computed style display or visibility state
 * the element is invisible.
 * The condition, element becomes invisible, is polled at the configured
 * `pollRate` (defaults to 1 second) for a maximum of `max` time (defaults to 15 seconds)
 * unless `max = -1` which in this case there is no maximum.
 * @param {SomeElement} elem - The element that should be removed
 * @param {WaitForOptions} [options] - Options controlling the wait
 * @return {Promise<WaitResult>}
 */
export function waitForElementToBecomeInvisible(elem, options) {
  const results = { predicate: false, maxExceeded: false };
  const opts = Object.assign({ pollRate: 1000, max: 15050 }, options);
  return new Promise(resolve => {
    if (!isElemVisible(elem)) {
      results.predicate = true;
      return resolve(results);
    }
    let safety;
    const poll = setInterval(() => {
      if (!isElemVisible(elem)) {
        if (safety) clearTimeout(safety);
        clearInterval(poll);
        results.predicate = true;
        return resolve(results);
      }
    }, opts.pollRate);
    if (opts.max !== -1) {
      safety = setTimeout(() => {
        clearInterval(poll);
        results.predicate = !isElemVisible(elem);
        results.maxExceeded = true;
        resolve(results);
      }, opts.max);
    }
  });
}

/**
 * Waits for the supplied element computed style display or visibility state
 * the element is visible.
 * The condition, element becomes visible, is polled at the configured
 * `pollRate` (defaults to 1 second) for a maximum of `max` time (defaults to 15 seconds)
 * unless `max = -1` which in this case there is no maximum.
 * @param {SomeElement} elem - The element that should be removed
 * @param {WaitForOptions} [options] - Options controlling the wait
 * @return {Promise<WaitResult>}
 */
export function waitForElementToBecomeVisible(elem, options) {
  const results = { predicate: false, maxExceeded: false };
  const opts = Object.assign({ pollRate: 1000, max: 15050 }, options);
  return new Promise(resolve => {
    if (!isElemVisible(elem)) {
      results.predicate = true;
      return resolve(results);
    }
    let safety;
    const poll = setInterval(() => {
      if (isElemVisible(elem)) {
        if (safety) clearTimeout(safety);
        clearInterval(poll);
        results.predicate = true;
        return resolve(results);
      }
    }, opts.pollRate);
    if (opts.max !== -1) {
      safety = setTimeout(() => {
        clearInterval(poll);
        results.predicate = isElemVisible(elem);
        results.maxExceeded = true;
        resolve(results);
      }, opts.max);
    }
  });
}
/**
 * @typedef {Object} WaitForOptions
 * @property {number} [pollRate = 1000] - The rate at which the condition will be checked
 * @property {?number} [max = 15000] - The maximum length of time the polling will happen in milliseconds
 */

/**
 * @typedef {Object} GuardedWaitForOptions
 * @property {function(): boolean} [guard] - Function polled to determine if the wait
 * is considered done by additional conditions
 * @property {number} [pollRate = 1000] - The rate at which the condition will be checked
 * @property {?number} [max] - The maximum length of time the polling will happen in milliseconds
 */

/**
 * @typedef {Object} WaitResult
 * @property {boolean} predicate - T/F indicating if the stopping condition(s) of a wait was met, this includes guards
 * @property {boolean} maxExceeded - T/F indicating if the configured maximum wait time was exceeded
 */

/**
 * @typedef {Object} WaitForSelectorOptions
 * @property {string} selector - The selector to be waited for
 * @param {SomeElement|Document} [cntx] - element to use rather than document for the querySelector call
 * @param {WaitForOptions} [options] - Options controlling the wait
 */
