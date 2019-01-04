import { delay, waitForPredicate, setTimeoutP } from './delays';
import { scrollIntoView } from './scrolls';

/**
 * @desc Calls the click function on the supplied element if non-null/defined.
 * Returns true or false to indicate if the click happened
 * @param {HTMLElement | Element | Node} elem - The element to be clicked
 * @return {boolean}
 */
export function click(elem) {
  let clicked = false;
  if (elem != null) {
    elem.dispatchEvent(
      new window.MouseEvent('mouseover', {
        view: window,
        bubbles: true,
        cancelable: true
      })
    );
    elem.click();
    clicked = true;
  }
  return clicked;
}

/**
 * @desc Calls the click function on the supplied element if non-null/defined.
 * Returns true or false to indicate if the click happened
 * @param {HTMLElement | Element | Node} elem - The element to be clicked
 * @param {Window} cntx - The context window
 * @return {boolean}
 */
export function clickInContext(elem, cntx) {
  let clicked = false;
  if (elem != null) {
    elem.dispatchEvent(
      new cntx.MouseEvent('mouseover', {
        view: cntx,
        bubbles: true,
        cancelable: true
      })
    );
    elem.click();
    clicked = true;
  }
  return clicked;
}

/**
 * @param {HTMLElement | Element | Node} elem - The element to be clicked
 * @param {number} [delayTime = 1000] - How long is the delay
 * @returns {Promise<boolean>}
 */
export async function clickWithDelay(elem, delayTime = 1000) {
  let clicked = click(elem);
  if (clicked) {
    await delay(delayTime);
  }
  return clicked;
}

/**
 * @param {HTMLElement | Element | Node} elem - The element to be clicked
 * @param {Window} cntx - The context window
 * @param {number} [delayTime = 1000] - How long is the delay
 * @returns {Promise<boolean>}
 */
export async function clickInContextWithDelay(elem, cntx, delayTime = 1000) {
  let clicked = clickInContext(elem, cntx);
  if (clicked) {
    await delay(delayTime);
  }
  return clicked;
}

/**
 * @param {HTMLElement | Element | Node} elem - The element to be
 * @return {boolean}
 */
export function scrollIntoViewAndClick(elem) {
  scrollIntoView(elem);
  return click(elem);
}

/**
 * @param {HTMLElement | Element | Node} elem - The element to be
 * @param {number} [delayTime = 1000] - How long is the delay
 * @returns {Promise<boolean>}
 */
export function scrollIntoViewAndClickWithDelay(elem, delayTime = 1000) {
  scrollIntoView(elem);
  return clickWithDelay(elem, delayTime);
}

/**
 * @param {Array<HTMLElement | Element | Node>} elems
 */
export function scrollAllIntoViewAndClick(elems) {
  let i = 0;
  let length = elems.length;
  for (; i < length; ++i) {
    scrollIntoView(elems[i]);
    click(elems[i]);
  }
}

/**
 * @param {Array<HTMLElement | Element | Node>} elems
 * @param {number} [delayTime = 1000] - How long is the delay
 * @returns {Promise<void>}
 */
export async function scrollAllIntoViewAndClickWithDelay(
  elems,
  delayTime = 1000
) {
  let i = 0;
  let length = elems.length;
  for (; i < length; ++i) {
    scrollIntoView(elems[i]);
    await clickWithDelay(elems[i], delayTime);
  }
}

/**
 * @param {string} selector - the css selector to use
 * @returns {boolean}
 */
export function selectElemAndClick(selector) {
  return click(document.querySelector(selector));
}

/**
 * @param {string} selector - the css selector to use
 * @param {number} [delayTime = 1000] - How long is the delay
 * @returns {Promise<boolean>}
 */
export function selectElemAndClickWithDelay(selector, delayTime = 1000) {
  return clickWithDelay(document.querySelector(selector), delayTime);
}

/**
 * @param {Element | Node | HTMLElement} selectFrom - element to use for the querySelector call
 * @param {string} selector - the css selector to use
 * @returns {boolean}
 */
export function selectElemFromAndClick(selectFrom, selector) {
  return click(selectFrom.querySelector(selector));
}

/**
 * @param {Element | Node | HTMLElement} selectFrom - element to use for the querySelector call
 * @param {string} selector - the css selector to use
 * @param {number} [delayTime = 1000] - How long is the delay
 * @returns {Promise<boolean>}
 */
export function selectElemFromAndClickWithDelay(
  selectFrom,
  selector,
  delayTime = 1000
) {
  return clickWithDelay(selectFrom.querySelector(selector), delayTime);
}

/**
 * @param {Element | Node | HTMLElement} elem - the element to be clicked
 * @param {function(): boolean} predicate - function returning true or false indicating the wait condition is satisfied
 * @returns {Promise<boolean>}
 */
export async function clickAndWaitFor(elem, predicate) {
  const clicked = click(elem);
  if (clicked) {
    await waitForPredicate(predicate);
  }
  return clicked;
}

/**
 * @param {string} selector - the css selector to use
 * @param {function(): boolean} predicate - function returning true or false indicating the wait condition is satisfied
 * @param {HTMLElement | Document} [selectFrom] - optional element rather than document to use for the querySelector(selector) call
 * @returns {Promise<boolean>}
 */
export function selectClickAndWaitFor(selector, predicate, selectFrom) {
  return clickAndWaitFor(
    (selectFrom || document).querySelector(selector),
    predicate
  );
}

/**
 * @param {HTMLElement | Element} selectFrom
 * @param {string} selector - the css selector to use
 * @param {number} n - How many times to click the element returned by
 * performing selectFrom.querySelector(selector)
 */
export function selectFromAndClickNTimes(selectFrom, selector, n) {
  let i = 0;
  let clickMe;
  for (; i < n; ++i) {
    clickMe = selectFrom.querySelector(selector);
    if (clickMe) {
      click(clickMe);
    }
  }
}

/**
 * @param {HTMLElement | Element} selectFrom - The element to use to call querySelector(selector) on
 * @param {string} selector - the css selector to use
 * @param {number} n - How many times to click the element returned by
 * performing selectFrom.querySelector(selector)
 * @param {number} [delayTime = 1000] - How long is the delay
 */
export async function selectFromAndClickNTimesWithDelay(
  selectFrom,
  selector,
  n,
  delayTime = 1000
) {
  let i = 0;
  let clickMe;
  for (; i < n; ++i) {
    clickMe = selectFrom.querySelector(selector);
    if (clickMe) {
      await clickWithDelay(clickMe, delayTime);
    }
  }
}

/**
 * @param {HTMLElement | Element} selectFrom - The element to use to call querySelector(selector) on
 * @param {string} selector - the css selector to use
 * performing selectFrom.querySelector(selector)
 * @param {Object} [opts = {}] - options about delayTime and safety time
 */
export async function selectFromAndClickUntilNullWithDelay(
  selectFrom,
  selector,
  opts = {}
) {
  const delayTime = opts.delayTime || 1000;
  let exit = false;
  let safety;
  if (opts.safety) {
    safety = setTimeout(() => {
      exit = true;
    }, opts.safety);
  }
  let clickMe = selectFrom.querySelector(selector);
  while (clickMe != null) {
    if (exit) break;
    await clickWithDelay(clickMe, delayTime);
    clickMe = selectFrom.querySelector(selector);
  }
  if (opts.safety) {
    clearTimeout(safety);
  }
}
