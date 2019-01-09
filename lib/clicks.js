import { delay, waitForPredicate } from './delays';
import { scrollIntoView } from './scrolls';
import { qs } from './dom';
import { createMouseEvent, fireMouseEventsOnElement } from './events';

const __clickPreEvents = ['mousemove', 'mouseover', 'mousedown', 'mouseup'];

/**
 * @desc Calls the click function on the supplied element if non-null/defined.
 * Returns true or false to indicate if the click happened
 * @param {HTMLElement} elem - The element to be clicked
 * @return {boolean} - T/F to indicate that click happened.
 */
export function click(elem) {
  let clicked = false;
  if (elem != null) {
    fireMouseEventsOnElement({
      elem,
      eventNames: __clickPreEvents
    });
    elem.click();
    elem.dispatchEvent(createMouseEvent({ type: 'mouseleave', elem }));
    clicked = true;
  }
  return clicked;
}

/**
 * @desc Calls the click function on the supplied element if non-null/defined
 * that exists in the JS context of the supplied window (cntx).
 * Returns true or false to indicate if the click happened
 * @param {HTMLElement} elem - The element to be clicked
 * @param {Window} cntx - The context window
 * @return {boolean} - T/F to indicate that click happened.
 */
export function clickInContext(elem, cntx) {
  let clicked = false;
  if (elem != null) {
    fireMouseEventsOnElement({
      elem,
      eventNames: __clickPreEvents,
      view: cntx
    });
    elem.click();
    elem.dispatchEvent(
      createMouseEvent({ type: 'mouseleave', view: cntx, elem })
    );
    clicked = true;
  }
  return clicked;
}

/**
 * @desc Calls the click method of the supplied element and waits the
 * specified delayTime after clicking IFF the supplied element was
 * non-null/undefined.
 * @param {HTMLElement|Element} elem - The element to be clicked
 * @param {number} [delayTime = 1000] - How long is the delay after click
 * @return {Promise<boolean>} - A Promise that resolves to T/F
 * indicating if the click happened
 */
export async function clickWithDelay(elem, delayTime) {
  let clicked = click(elem);
  if (clicked) {
    await delay(delayTime || 1000);
  }
  return clicked;
}

/**
 * @desc Calls the click method of the supplied element and waits the
 * specified delayTime after clicking IFF the supplied element was
 * non-null/undefined.
 * @param {HTMLElement|Element} elem - The element to be clicked
 * @param {{delayTime: number, cntx: Window}} [options] - Options controlling
 * how long the delay is (delay time) and or a supplied window object of an iframe
 * we are clicking an element within (cntx)
 * @return {Promise<boolean>} - A Promise that resolves to T/F
 * indicating if the click happened
 */
export async function clickWithDelay2(elem, options) {
  const opts = Object.assign({ delayTime: 1000 }, options);
  const clicked = opts.cntx ? clickInContext(elem, opts.cntx) : click(elem);
  if (clicked) {
    await delay(opts.delayTime);
  }
  return clicked;
}

/**
 * @desc Calls the click method of the supplied element that exists in
 * the JS context of the supplied window object (cntx) and waits the
 * specified delayTime after clicking IFF the supplied element was
 * non-null/undefined.
 * @param {HTMLElement|Element} elem - The element to be clicked
 * @param {Window} cntx - The context window
 * @param {number} [delayTime = 1000] - How long is the delay after click
 * @return {Promise<boolean>} - A Promise that resolves to T/F
 * indicating if the click happened
 */
export async function clickInContextWithDelay(elem, cntx, delayTime) {
  let clicked = clickInContext(elem, cntx);
  if (clicked) {
    await delay(delayTime || 1000);
  }
  return clicked;
}

/**
 * @desc Scrolls the supplied element into view and clicks it if the
 * element is non-null/undefined
 * @param {HTMLElement|Element} elem - The element to be scrolled into view
 * and clicked.
 * @return {boolean} - T/F to indicate that the click happened
 */
export function scrollIntoViewAndClick(elem) {
  scrollIntoView(elem);
  return click(elem);
}

/**
 * @desc Scrolls the supplied element into view and clicks it if the
 * element is non-null/undefined
 * @param {HTMLElement|Element} elem - The element to be scrolled into view
 * and clicked.
 * @param {Window} cntx - Optional window object associated with the iframe
 * the element lives in
 * @return {boolean} - T/F to indicate that the click happened
 */
export function scrollIntoViewAndClick2(elem, cntx) {
  scrollIntoView(elem);
  return cntx != null ? clickInContext(elem, cntx) : click(elem);
}

/**
 * @desc Scrolls the supplied element into view and clicks it if the
 * element is non-null/undefined and waits for the specified delay time
 * @param {HTMLElement|Element} elem - The element to be
 * @param {number} [delayTime = 1000] - How long is the delay
 * @return {Promise<boolean>} - A Promise that resolves to T/F indicating
 * that the click happened
 */
export function scrollIntoViewAndClickWithDelay(elem, delayTime) {
  scrollIntoView(elem);
  return clickWithDelay(elem, delayTime || 1000);
}

/**
 * @desc Scrolls the supplied element into view and clicks it if the
 * element is non-null/undefined and waits for the specified delay time
 * @param {HTMLElement|Element} elem - The element to be
 * @param {{delayTime: number, cntx: Window}} [options] - Options controlling
 * how long the delay is (delay time) and or a supplied window object of an iframe
 * we are clicking an element within (cntx)
 * @return {Promise<boolean>} - A Promise that resolves to T/F indicating
 * that the click happened
 */
export function scrollIntoViewAndClickWithDelay2(elem, options) {
  const opts = Object.assign({ delayTime: 1000 }, options);
  scrollIntoView(elem);
  return opts.cntx != null
    ? clickInContextWithDelay(elem, opts.cntx, opts.delayTime)
    : clickWithDelay(elem, opts.delayTime);
}

/**
 * @desc Scrolls into view and clicks all the elements
 * present in the supplied array.
 * @param {Array<HTMLElement>} elems - The array of elements
 * to be scrolled into view and clicked
 * @return {void}
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
 * @desc Scrolls into view and clicks all the elements
 * present in the supplied array waiting for the supplied
 * delay time after each click of an element in the array.
 * @param {Array<HTMLElement|Element|Node>} elems - The array of elements
 * to be scrolled into view and clicked
 * @param {number} [delayTime = 1000] - How long is the delay after click
 * @return {Promise<void>}
 */
export async function scrollAllIntoViewAndClickWithDelay(elems, delayTime) {
  const delayAmount = delayTime || 1000;
  const length = elems.length;
  for (var i = 0; i < length; ++i) {
    scrollIntoView(elems[i]);
    await clickWithDelay(elems[i], delayAmount);
  }
}

/**
 * @desc Clicks the element from executing document.querySelector using
 * the supplied selector
 * @param {string} selector - the css selector to use
 * @return {boolean} - T/F to indicate that the click happened
 */
export function selectElemAndClick(selector) {
  return click(document.querySelector(selector));
}

/**
 * @desc Clicks the element from executing document.querySelector using
 * the supplied selector and waiting the specified delay time after clicking
 * @param {string} selector - the css selector to use
 * @param {number} [delayTime = 1000] - How long is the delay
 * @return {Promise<boolean>} - A Promise that resolves to T/F indicating
 * that the click happened
 */
export function selectElemAndClickWithDelay(selector, delayTime) {
  return clickWithDelay(document.querySelector(selector), delayTime || 1000);
}

/**
 * @desc Clicks the element from executing querySelector using
 * the supplied selector using the supplied element
 * @param {Element|Node|HTMLElement} selectFrom - element to use for the querySelector call
 * @param {string} selector - the css selector to use
 * @return {boolean} - T/F to indicate that the click happened
 */
export function selectElemFromAndClick(selectFrom, selector) {
  return click(selectFrom.querySelector(selector));
}

/**
 * @desc Clicks the element from executing querySelector using
 * the supplied selector from the supplied element and waiting the specified delay time after clicking
 * @param {Element|Node|HTMLElement} selectFrom - element to use for the querySelector call
 * @param {string} selector - the css selector to use
 * @param {number} [delayTime = 1000] - How long is the delay
 * @return {Promise<boolean>} - A Promise that resolves to T/F indicating
 * that the click happened
 */
export function selectElemFromAndClickWithDelay(
  selectFrom,
  selector,
  delayTime
) {
  return clickWithDelay(qs(selector, selectFrom), delayTime || 1000);
}

/**
 * @desc Clicks the supplied element and then waits for the supplied predicate function to return true
 * @param {Element|Node|HTMLElement} elem - the element to be clicked
 * @param {function(): boolean} predicate - function returning true or false indicating the wait condition is satisfied
 * @return {Promise<boolean>} - A Promise that resolves to T/F indicating that the click happened
 */
export async function clickAndWaitFor(elem, predicate) {
  const clicked = click(elem);
  if (clicked) {
    await waitForPredicate(predicate);
  }
  return clicked;
}

/**
 * @desc Clicks the element returned by calling querySelector using the selector
 * on document or the supplied element (selectFrom) and then waits for the supplied
 * predicate function to return true
 * @param {string} selector - the css selector to use
 * @param {function(): boolean} predicate - function returning true or false indicating the wait condition is satisfied
 * @param {HTMLElement|Document} [selectFrom] - optional element to use for the querySelector(selector) call
 * @return {Promise<boolean>} - A Promise that resolves to T/F indicating that the click happened
 */
export function selectClickAndWaitFor(selector, predicate, selectFrom) {
  return clickAndWaitFor(qs(selector, selectFrom), predicate);
}

/**
 * @desc Clicks the element returned from result of calling querySelector using the supplied
 * selector on the supplied element N number of times. Note that the evaluation of the querySelector
 * is done all N times.
 * @param {Element} selectFrom - element to use for the querySelector(selector) call
 * @param {string} selector - the css selector to use
 * @param {number} n - How many times to click the element returned by
 * performing selectFrom.querySelector(selector)
 */
export function selectFromAndClickNTimes(selectFrom, selector, n) {
  let clickMe;
  for (var i = 0; i < n; ++i) {
    clickMe = selectFrom.querySelector(selector);
    if (clickMe) {
      click(clickMe);
    }
  }
}

/**
 * @desc Clicks the element returned from result of calling querySelector using the supplied
 * selector on the supplied element N number of times and waits for delay time afters each click.
 * Note that the evaluation of the querySelector is done all N times.
 * @param {Element} selectFrom - The element to use to call querySelector(selector) on
 * @param {string} selector - the css selector to use
 * @param {number} n - How many times to click the element returned by
 * performing selectFrom.querySelector(selector)
 * @param {number} [delayTime = 1000] - How long is the delay
 */
export async function selectFromAndClickNTimesWithDelay(
  selectFrom,
  selector,
  n,
  delayTime
) {
  const delayAmount = delayTime || 1000;
  let clickMe;
  for (var i = 0; i < n; ++i) {
    clickMe = selectFrom.querySelector(selector);
    if (clickMe) {
      await clickWithDelay(clickMe, delayAmount);
    }
  }
}

/**
 * @desc Clicks the element returned from result of calling querySelector using the supplied
 * selector on the supplied element until the results of the evaluting the selector returns null/undefined,
 * waiting for delay time afters each click.
 * @param {Element} selectFrom - The element to use to call querySelector(selector) on
 * @param {string} selector - the css selector to use
 * performing selectFrom.querySelector(selector)
 * @param {{delayTime: number, safety: ?number}} [options] - options about delayTime and safety time
 */
export async function selectFromAndClickUntilNullWithDelay(
  selectFrom,
  selector,
  options
) {
  const opts = Object.assign({ delayTime: 1000 }, options);
  const delayTime = opts.delayTime;
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
