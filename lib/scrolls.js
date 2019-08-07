import { delay, waitForPredicate } from './delays';

/** @ignore */
let isBadFF;

/**
 * Scrolls the supplied element into view.
 *
 * Scroll behavior:
 *  - behavior: smooth
 *  - block: center
 *  - inline: center
 * @param {Element} elem - The element to be scrolled into view
 * @param {Object} [opts] - Optional scroll behavior to be
 * used rather than the default
 * @return {void}
 */
export function scrollIntoView(elem, opts) {
  if (elem == null) return;
  if (isBadFF == null) {
    isBadFF = /Firefox\/57(?:\.[0-9]+)?/i.test(window.navigator.userAgent);
  }
  const defaults = isBadFF
    ? { behavior: 'smooth', inline: 'center' }
    : {
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      };
  elem.scrollIntoView(
    opts && typeof opts === 'object' ? Object.assign(defaults, opts) : defaults
  );
}

/**
 * Scrolls the supplied element into view, afterwards waits for the specified delay time
 *
 * Scroll behavior:
 *  - behavior: smooth
 *  - block: center
 *  - inline: center
 * @param {Element|HTMLElement|Node} elem - The element to be scrolled into view with delay
 * @param {number} [delayTime = 1000] - How long is the delay
 * @return {Promise<void>}
 */
export function scrollIntoViewWithDelay(elem, delayTime) {
  scrollIntoView(elem);
  return delay(delayTime || 1000);
}

/**
 * Scrolls the supplied element into view and then waits for the supplied predicate function to return true
 *
 * Scroll behavior:
 *  - behavior: smooth
 *  - block: center
 *  - inline: center
 * @param {Element|HTMLElement|Node} elem - The element to be scrolled into view with delay
 * @param {function(): boolean} predicate - Function returning T/F to indicate when the
 * condition waited for has been satisfied
 * @param {{wait: ?WaitForOptions, scrollBehavior: ?Object}} [options] - Options controlling
 * the scroll behavior and how the wait will happen
 * @return {Promise<{predicate: boolean, maxExceeded: boolean}>}
 */
export function scrollIntoViewAndWaitFor(elem, predicate, options) {
  scrollIntoView(elem, options && options.scrollBehavior);
  return waitForPredicate(predicate, options && options.wait);
}

/**
 * Scrolls the window by the supplied elements offsetTop. If the elements
 * offsetTop is zero then {@link scrollIntoView} is used
 * @param {Element|HTMLElement|Node} elem - The element who's offsetTop will be used to scroll by
 * @param {string} [behavior] - Options controlling the behavior of window.scrollTo
 * defaults to auto
 * @return {void}
 */
export function scrollToElemOffset(elem, behavior) {
  if (elem.offsetTop === 0) {
    return scrollIntoView(elem);
  }
  window.scrollTo({
    behavior: behavior || 'auto',
    left: 0,
    top: elem.offsetTop,
  });
}

/**
 * Scrolls the window by the supplied elements offsetTop. If the elements
 * offsetTop is zero then {@link scrollIntoView} is used
 * @param {Element|HTMLElement|Node} elem - The element who's offsetTop will be used to scroll by
 * @param {number} [delayTime = 1000] - How long is the delay
 * @return {Promise<void>}
 */
export function scrollToElemOffsetWithDelay(elem, delayTime) {
  scrollToElemOffset(elem);
  return delay(delayTime || 1000);
}

/**
 * Scrolls down by the elements height
 * @param {Element|HTMLElement|Node} elem - The element who's height
 * to scroll down by
 * @return {void}
 */
export function scrollDownByElemHeight(elem) {
  if (!elem) return;
  const rect = elem.getBoundingClientRect();
  scrollWindowBy(0, rect.height + elem.offsetHeight);
}

/**
 * Scrolls down by supplied elements height and then waits for
 * the supplied delay time.
 * @param {Element|HTMLElement|Node} elem - The element to be
 * @param {number} [delayTime = 1000] - How long is the delay
 * @return {Promise<void>}
 */
export function scrollDownByElemHeightWithDelay(elem, delayTime) {
  scrollDownByElemHeight(elem);
  return delay(delayTime || 1000);
}

/**
 * Determines if we can scroll down any more
 * @return {boolean} - T/F indicating if we can scroll down some more
 */
export function canScrollDownMore() {
  return (
    window.scrollY + window.innerHeight <
    Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.body.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight
    )
  );
}

/**
 * Determines if we can scroll up any more
 * @return {boolean} - T/F indicating if we can scroll up some more
 */
export function canScrollUpMore() {
  return window.scrollY !== 0;
}

/**
 * Scrolls the window by the supplied x and y amount
 * @param {number} x - Amount to scroll in the x direction
 * @param {number} y - Amount to scroll in the y direction
 */
export function scrollWindowBy(x, y) {
  window.scrollBy(x, y);
}

/**
 * Scrolls the window by the supplied x and y amount smoothly
 * @param {number} x - Amount to scroll in the x direction
 * @param {number} y - Amount to scroll in the y direction
 */
export function smoothScrollWindowBy(x, y) {
  window.scrollBy({ left: x, top: y, behavior: 'smooth' });
}

/**
 * Scrolls the window down by the supplied amount
 * @param {number} amount - Amount to scroll the down by
 */
export function scrollWindowDownBy(amount) {
  scrollWindowBy(0, amount);
}

/**
 * Scrolls the window down by the supplied amount smoothly
 * @param {number} amount - Amount to scroll the down by
 */
export function smoothScrollWindowDownBy(amount) {
  smoothScrollWindowBy(0, amount);
}

/**
 * Scrolls the window by the supplied x and y amount
 * @param {number} x - Amount to scroll in the x direction
 * @param {number} y - Amount to scroll in the y direction
 * @param {number} [delayTime = 1500]
 * @return {Promise<void>}
 */
export function scrollWindowByWithDelay(x, y, delayTime) {
  scrollWindowBy(x, y);
  return delay(delayTime || 1500);
}

/**
 * Scrolls the window down by the supplied amount
 * @param {number} amount - Amount to scroll the down by
 * @param {number} [delayTime = 1500]
 * @return {Promise<void>}
 */
export function scrollWindowDownByWithDelay(amount, delayTime) {
  scrollWindowBy(0, amount);
  return delay(delayTime || 1500);
}

/**
 * Creates and returns an object that calculates the scroll amount, up/down or left/right,
 * based on dividing the scroll width/height by the supplied desired times to completely
 * scroll the page, defaults to 10.
 *
 * The calculation also takes into account the fact that the height or width of
 * the document may change and reacts to those changes such that the returned scroll
 * amount is always proportional to the documents current maximum scroll height or width
 *
 * @param {number} [desiredTimesToScroll = 10] - How many scrolls until the maximum scroll
 * position is reached
 * @return {{timesToScroll: number, scrollUpDownAmount: number, scrollLeftRightAmount: number}}
 */
export function createScrollAmount(desiredTimesToScroll) {
  let docsBoundingCRect = document.documentElement.getBoundingClientRect();
  const getMaxUpDown = () =>
    Math.max(
      document.scrollingElement.scrollHeight,
      document.documentElement.scrollHeight,
      docsBoundingCRect.bottom
    );
  const getMaxLeftRight = () =>
    Math.max(
      document.scrollingElement.scrollWidth,
      document.documentElement.scrollWidth,
      docsBoundingCRect.right
    );
  let lastUpDownMax = getMaxUpDown();
  let lastLeftRightMax = getMaxLeftRight();
  return {
    timesToScroll: desiredTimesToScroll || 10,
    get scrollUpDownAmount() {
      let currentMax = getMaxUpDown();
      if (currentMax !== lastUpDownMax) {
        docsBoundingCRect = document.documentElement.getBoundingClientRect();
        currentMax = getMaxUpDown();
        lastUpDownMax = currentMax;
      }
      return currentMax / this.timesToScroll;
    },
    get scrollLeftRightAmount() {
      let currentMax = getMaxLeftRight();
      if (currentMax !== lastLeftRightMax) {
        docsBoundingCRect = document.documentElement.getBoundingClientRect();
        currentMax = getMaxLeftRight();
        lastLeftRightMax = currentMax;
      }
      return currentMax / this.timesToScroll;
    },
  };
}

/**
 * @typedef {Object} Scroller
 * @property {number} timesToScroll - the desired number of times to be scrolled
 * @property {number} scrollUpDownAmount - The current amount to be scrolled up or down
 * @property {number} scrollLeftRightAmount - The current amount to be scrolled left or right
 * @property {function(): void} scrollRight - Scroll the page right
 * @property {function(): void} scrollLeft - Scroll the page left
 * @property {function(): void} scrollUp - Scroll the page up
 * @property {function(): void} scrollDown - Scroll the page down
 * @property {function(): boolean} canScrollDownMore - Can the page be scrolled some more down
 * @property {function(): boolean} canScrollUpMore - Can the page be scrolled some more up
 */

/**
 * Creates and returns an object for scrolling the page up/down and left/right.
 * The number of times a respective scroll has occurred is also tracked.
 *
 * For additional details see the documentation of {@link createScrollAmount}
 * as the amount of scroll applied is determined the object it returns.
 *
 * @param {number} [timesToScroll = 10] - How many scrolls until the maximum scroll
 * position is reached
 * @return {Scroller}
 */
export function createScroller(timesToScroll) {
  const scrollAmount = createScrollAmount(timesToScroll || 10);
  return Object.assign(
    {
      canScrollDownMore,
      canScrollUpMore,
      scrollDown() {
        scrollWindowBy(0, this.scrollUpDownAmount);
      },
      scrollUp() {
        scrollWindowBy(0, -this.scrollUpDownAmount);
      },
      scrollLeft() {
        scrollWindowBy(-this.scrollLeftRightAmount, 0);
      },
      scrollRight() {
        scrollWindowBy(this.scrollLeftRightAmount, 0);
      },
    },
    scrollAmount
  );
}
