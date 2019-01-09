import { delay, waitForPredicate } from './delays';

/**
 * @desc Scrolls the supplied element into view.
 *
 * Scroll behavior:
 *  - behavior: smooth
 *  - block: center
 *  - inline: center
 * @param {Element} elem - The element to be scrolled into view
 * @return {void}
 */
export function scrollIntoView(elem) {
  if (elem == null) return;
  elem.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'center'
  });
}

/**
 * @desc Scrolls the supplied element into view, afterwards waits for the specified delay time
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
 * @desc Scrolls the supplied element into view and then waits for the supplied predicate function to return true
 *
 * Scroll behavior:
 *  - behavior: smooth
 *  - block: center
 *  - inline: center
 * @param {Element|HTMLElement|Node} elem - The element to be scrolled into view with delay
 * @param {function(): boolean} predicate - Function returning T/F to indicate when the
 * condition waited for has been satisfied
 * @return {Promise<void>}
 */
export function scrollIntoViewAndWaitFor(elem, predicate) {
  scrollIntoView(elem);
  return waitForPredicate(predicate);
}

/**
 * @desc Scrolls the window by the supplied elements offsetTop. If the elements
 * offsetTop is zero then {@link scrollIntoView} is used
 * @param {Element|HTMLElement|Node} elem - The element who's offsetTop will be used to scroll by
 * @return {void}
 */
export function scrollToElemOffset(elem) {
  if (elem.offsetTop === 0) {
    return scrollIntoView(elem);
  }
  window.scrollTo({
    behavior: 'auto',
    left: 0,
    top: elem.offsetTop
  });
}

/**
 * @desc Scrolls the window by the supplied elements offsetTop. If the elements
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
 * @desc Scrolls down by the elements height
 * @param {Element|HTMLElement|Node} elem - The element who's height
 * to scroll down by
 * @return {void}
 */
export function scrollDownByElemHeight(elem) {
  if (!elem) return;
  const rect = elem.getBoundingClientRect();
  window.scrollBy(0, rect.height + elem.offsetHeight);
}

/**
 * @desc Scrolls down by supplied elements height and then waits for
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
 * @desc Determines if we can scroll down any more
 * @return {boolean} - T/F indicating if we can scroll down some more
 */
export function canScrollMore() {
  return (
    window.scrollY + window.innerHeight <
    Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    )
  );
}

/**
 * @desc Scrolls the window by the supplied x and y amount
 * @param {number} x - Amount to scroll in the x direction
 * @param {number} y - Amount to scroll in the y direction
 */
export function scrollWindowBy(x, y) {
  window.scrollBy(x, y);
}

/**
 * @desc Scrolls the window down by the supplied amount
 * @param {number} amount - Amount to scroll the down by
 */
export function scrollWindowDownBy(amount) {
  window.scrollBy(0, amount);
}

/**
 * @desc Scrolls the window by the supplied x and y amount
 * @param {number} x - Amount to scroll in the x direction
 * @param {number} y - Amount to scroll in the y direction
 * @param {number} [delayTime = 1500]
 * @return {Promise<void>}
 */
export function scrollWindowByWithDelay(x, y, delayTime) {
  window.scrollBy(x, y);
  return delay(delayTime || 1500);
}

/**
 * @desc Scrolls the window down by the supplied amount
 * @param {number} amount - Amount to scroll the down by
 * @param {number} [delayTime = 1500]
 * @return {Promise<void>}
 */
export function scrollWindowDownByWithDelay(amount, delayTime) {
  window.scrollBy(0, amount);
  return delay(delayTime || 1500);
}
