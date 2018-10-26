import { qs, selectorExists } from './dom';

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
 * returns a truthy value. Polling via requestAnimationFrame.
 * @param {function(): boolean} predicate
 * @return {Promise<void>}
 */
export function waitForPredicate(predicate) {
  return new Promise(resolve => {
    const cb = () => {
      if (predicate()) {
        resolve();
      } else {
        window.requestAnimationFrame(cb);
      }
    };
    window.requestAnimationFrame(cb);
  });
}

/**
 * @desc Returns a promise that resolves when the supplied predicate function
 * returns a truthy value. Polling via requestAnimationFrame.
 * @param {function(): boolean} predicate
 * @param {number} time
 * @return {Promise<void>}
 */
export function waitForPredicateAtMax(predicate, time) {
  return new Promise(resolve => {
    let rafID = -1;
    let to = -1;
    const cb = () => {
      if (predicate()) {
        clearTimeout(to);
        resolve();
      } else {
        rafID = window.requestAnimationFrame(cb);
      }
    };
    to = setTimeout(() => {
      window.cancelAnimationFrame(rafID);
      resolve();
    }, time);
    rafID = window.requestAnimationFrame(cb);
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
