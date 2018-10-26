import { delay, waitForPredicate } from './delays';

/**
 * @param {Element | HTMLElement | Node} elem - The element to be scrolled into view
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
 * @param {Element | HTMLElement | Node} elem - The element to be scrolled into view with delay
 * @param {number} [delayTime = 1000] - How long is the delay
 * @returns {Promise<void>}
 */
export function scrollIntoViewWithDelay(elem, delayTime = 1000) {
  scrollIntoView(elem);
  return delay(delayTime);
}

export function scrollIntoViewAndWaitFor (elem, predicate) {
  scrollIntoView(elem);
  return waitForPredicate(predicate);
}

/**
 * @desc Scrolls the window by the supplied elements offsetTop. If the elements
 * offsetTop is zero then {@link scrollIntoView} is used
 * @param {Element | HTMLElement | Node} elem - The element who's offsetTop will be used to scroll by
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
 * @param {Element | HTMLElement | Node} elem - The element who's offsetTop will be used to scroll by
 * @param {number} [delayTime = 1000] - How long is the delay
 * @returns {Promise<void>}
 */
export function scrollToElemOffsetWithDelay(elem, delayTime = 1000) {
  scrollToElemOffset(elem);
  return delay(delayTime);
}

/**
 * @param {Element | HTMLElement | Node} elem - The element to be
 */
export function scrollDownByElemHeight(elem) {
  if (!elem) return;
  const rect = elem.getBoundingClientRect();
  window.scrollBy(0, rect.height + elem.offsetHeight);
}

/**
 * @param {Element | HTMLElement | Node} elem - The element to be
 * @param {number} [delayTime = 1000] - How long is the delay
 * @returns {Promise<void>}
 */
export function scrollDownByElemHeightWithDelay(elem, delayTime = 1000) {
  scrollDownByElemHeight(elem);
  return delay(delayTime);
}

/**
 * @desc Determines if we can scroll any more
 * @return {boolean}
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
