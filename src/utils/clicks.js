import Delays from './delays';
import Scrolls from './scrolls';
import Dom from './dom';

export default class Clicks {
  /**
   * @param {HTMLElement | Element | Node} elem
   * @return {boolean}
   */
  static click(elem) {
    let clicked = false;
    if (elem != null) {
      elem.click();
      clicked = true;
    }
    return clicked;
  }

  /**
   * @param {HTMLElement | Element | Node} elem
   * @param {number} [delayTime = 1000]
   * @returns {Promise<boolean>}
   */
  static async clickWithDelay(elem, delayTime = 1000) {
    let clicked = Clicks.click(elem);
    if (clicked) {
      await Delays.delay(delayTime);
    }
    return clicked;
  }

  /**
   * @param {HTMLElement | Element | Node} elem
   * @return {boolean}
   */
  static scrollIntoViewAndClick(elem) {
    Scrolls.scrollIntoView(elem);
    return Clicks.click(elem);
  }

  /**
   * @param {HTMLElement | Element | Node} elem
   * @param {number} [delayTime = 1000]
   * @returns {Promise<boolean>}
   */
  static scrollIntoViewAndClickWithDelay(elem, delayTime = 1000) {
    Scrolls.scrollIntoView(elem);
    return Clicks.clickWithDelay(elem, delayTime);
  }

  /**
   * @param {Array<HTMLElement | Element | Node>} elems
   */
  static scrollAllIntoViewAndClick(elems) {
    let i = 0;
    let length = elems.length;
    for(; i < length; ++i) {
      Scrolls.scrollIntoView(elems[i]);
      Clicks.click(elems[i]);
    }
  }

  /**
   * @param {Array<HTMLElement | Element | Node>} elems
   * @param {number} [delayTime = 1000]
   * @returns {Promise<void>}
   */
  static async scrollAllIntoViewAndClickWithDelay(elems, delayTime = 1000) {
    let i = 0;
    let length = elems.length;
    for(; i < length; ++i) {
      Scrolls.scrollIntoView(elems[i]);
      await Clicks.clickWithDelay(elems[i], delayTime);
    }
  }

  /**
   * @param {string} selector
   * @returns {boolean}
   */
  static selectElemAndClick(selector) {
    const theClickable = Dom.qs(selector, document);
    return Clicks.click(theClickable);
  }

  /**
   * @param {string} selector
   * @param {number} [delay = 1000]
   * @returns {Promise<boolean>}
   */
  static selectElemAndClickWithDelay(selector, delay = 1000) {
    const theClickable = Dom.qs(selector, document);
    return Clicks.clickWithDelay(theClickable, delay);
  }

  /**
   * @param {string} selector
   * @param {Element | Node | HTMLElement} selectFrom
   * @returns {boolean}
   */
  static selectElemFromAndClick(selector, selectFrom) {
    const theClickable = Dom.qs(selector, selectFrom);
    return Clicks.click(theClickable);
  }

  /**
   * @param {string} selector
   * @param {Element | Node | HTMLElement} selectFrom
   * @param {number} [delay = 1000]
   * @returns {Promise<boolean>}
   */
  static selectElemFromAndClickWithDelay(selector, selectFrom, delay = 1000) {
    const theClickable = Dom.qs(selector, selectFrom);
    return Clicks.clickWithDelay(theClickable, delay);
  }

  /**
   * @param {Element | Node | HTMLElement} elem
   * @param {function(): boolean} predicate
   * @returns {Promise<boolean>}
   */
  static async clickAndWaitFor(elem, predicate) {
    const clicked = Clicks.click(elem);
    if (clicked) {
      await Delays.waitForPredicate(predicate);
    }
    return clicked;
  }

  /**
   * @param {string} selector
   * @param {function(): boolean} predicate
   * @param {HTMLElement | Document} [selectFrom]
   * @returns {Promise<boolean>}
   */
  static selectClickAndWaitFor(selector, predicate, selectFrom) {
    return Clicks.clickAndWaitFor(Dom.qs(selector, selectFrom), predicate);
  }

  /**
   * @param {HTMLElement | Element} selectFrom
   * @param {string} selector
   * @param {number} n
   */
  static selectFromAndClickNTimes(selectFrom, selector, n) {
    let i = 0;
    let clickMe;
    for (; i < n; ++i) {
      clickMe = selectFrom.querySelector(selector);
      if (clickMe) {
        Clicks.click(clickMe);
      }
    }
  }

  /**
   * @param {HTMLElement | Element} selectFrom
   * @param {string} selector
   * @param {number} n
   * @param {number} [delayTime = 1000]
   */
  static async selectFromAndClickNTimesWithDealy(
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
        await Clicks.clickWithDelay(clickMe, delayTime);
      }
    }
  }
}
