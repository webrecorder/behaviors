import Delays from './delays';

export default class Scrolls {
  /**
   * @param {Element | HTMLElement | Node} elem
   */
  static scrollIntoView(elem) {
    if (elem == null) return;
    elem.scrollIntoView({
      behavior: 'auto',
      block: 'center',
      inline: 'center'
    });
  }

  /**
   * @param {Element | HTMLElement | Node} elem
   * @param {number} [delayTime = 1000]
   * @returns {Promise<void>}
   */
  static scrollIntoViewWithDelay(elem, delayTime = 1000) {
    Scrolls.scrollIntoView(elem);
    return Delays.delay(delayTime);
  }

  /**
   * @param {Element | HTMLElement | Node} elem
   */
  static scrollToElemOffset(elem) {
    if (elem.offsetTop === 0) {
      return Scrolls.scrollIntoView(elem);
    }
    window.scrollTo({
      behavior: 'auto',
      left: 0,
      top: elem.offsetTop
    });
  }

  /**
   * @param {Element | HTMLElement | Node} elem
   * @param {number} [delayTime = 1000]
   * @returns {Promise<void>}
   */
  static scrollToElemOffsetWithDelay(elem, delayTime = 1000) {
    Scrolls.scrollToElemOffset(elem);
    return Delays.delay(delayTime)
  }

  /**
   * @param {Element | HTMLElement | Node} elem
   */
  static scrollDownByElemHeight(elem) {
    if (!elem) return;
    const rect = elem.getBoundingClientRect();
    window.scrollBy(0, rect.height + elem.offsetHeight);
  }

  /**
   * @param {Element | HTMLElement | Node} elem
   * @param {number} [delayTime = 1000]
   * @returns {Promise<void>}
   */
  static scrollDownByElemHeightWithDelay(elem, delayTime = 1000) {
    Scrolls.scrollDownByElemHeight(elem);
    return Delays.delay(delayTime);
  }

  /**
   * @returns {boolean}
   */
  static canScrollMore() {
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
}
