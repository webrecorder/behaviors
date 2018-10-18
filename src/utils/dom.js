export default class DOM {
  /**
   * @param {string} xpathQuery
   * @param {Element | Document} startElem
   * @return {XPathResult}
   */
  static xpathSnapShot(xpathQuery, startElem) {
    if (startElem == null) {
      startElem = document;
    }
    return document.evaluate(
      xpathQuery,
      startElem,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
  }

  /**
   * @param {string} xpathQuery
   * @param {Element | Document} startElem
   * @return {Array<HTMLElement>}
   */
  static xpq(xpathQuery, startElem) {
    const snapShot = DOM.xpathSnapShot(xpathQuery, startElem);
    const elements = [];
    let i = 0;
    let len = snapShot.snapshotLength;
    while (i < len) {
      elements.push(snapShot.snapshotItem(i));
      i += 1;
    }
    return elements;
  }

  /**
   * @param {function(xpathQuery: string, startElem: ?HTMLElement)} xpg
   * @param {function(elem: HTMLElement): boolean} [filter]
   * @return {function(xpathQuery: string, startElem: ?HTMLElement | ?Document): Array<HTMLElement>}
   */
  static createXpathSelector(xpg, filter) {
    if (
      typeof xpg !== 'function' ||
      xpg.toString().indexOf('[Command Line API]') === -1
    ) {
      return function(xpathQuery, startElem) {
        const elems = DOM.xpq(xpathQuery, startElem);
        if (filter) return elems.filter(filter);
        return elems;
      };
    }
    if (filter) {
      return function(xpathQuery, startElem) {
        return xpg(xpathQuery, startElem).filter(filter);
      };
    }
    return xpg;
  }

  /**
   * @param {function(xpathQuery: string, startElem: ?HTMLElement)} xpg
   * @return {function(xpathQuery: string, startElem: ?HTMLElement | ?Document): Array<HTMLElement>}
   */
  static maybePolyfillXPG(xpg) {
    if (
      typeof xpg !== 'function' ||
      xpg.toString().indexOf('[Command Line API]') === -1
    ) {
      return function(xpathQuery, startElem) {
        return DOM.xpq(xpathQuery, startElem);
      };
    }
    return xpg;
  }

  /**
   * @param {string} selector
   * @param {Element | Node | HTMLElement} [selectFrom]
   * @returns {Element | Node | HTMLElement}
   */
  static qs(selector, selectFrom) {
    if (selectFrom != null) return selectFrom.querySelector(selector);
    return document.querySelector(selector);
  }

  /**
   * @param {string} selector
   * @param {Element | Node | HTMLElement} [selectFrom]
   * @returns {NodeList<Element | Node | HTMLElement>}
   */
  static qsa(selector, selectFrom) {
    if (selectFrom != null) return selectFrom.querySelectorAll(selector);
    return document.querySelectorAll(selector);
  }

  /**
   * @param {string} id
   * @returns {?HTMLElement}
   */
  static getById(id) {
    return document.getElementById(id);
  }

  /**
   * @param {string} selector
   * @param {Element | Node | HTMLElement} [selectFrom]
   * @returns {boolean}
   */
  static maybeRemoveElem(selector, selectFrom) {
    const elem = DOM.qs(selector, selectFrom);
    let removed = false;
    if (elem) {
      elem.remove();
      removed = true;
    }
    return removed;
  }

  /**
   * @param {string} id
   * @returns {boolean}
   */
  static maybeRemoveElemById(id) {
    const elem = DOM.getById(id);
    let removed = false;
    if (elem) {
      elem.remove();
      removed = true;
    }
    return removed;
  }

  /**
   * @param {Element | HTMLElement | Node} elem
   * @returns {boolean}
   */
  static elemHasNonZeroTopOffset(elem) {
    return elem.offsetTop !== 0;
  }

  /**
   * @param {HTMLElement | Element} elem
   * @param {string} [marker = 'wrvistited']
   */
  static markElemAsVisited(elem, marker = 'wrvistited') {
    if (elem != null) {
      elem.classList.add(marker);
    }
  }
}
