/**
 * @param {string} xpathQuery
 * @param {Element | Document} startElem
 * @return {XPathResult}
 */
export function xpathSnapShot(xpathQuery, startElem) {
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
export function xpq(xpathQuery, startElem) {
  const snapShot = xpathSnapShot(xpathQuery, startElem);
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
export function createXpathSelector(xpg, filter) {
  if (
    typeof xpg !== 'function' ||
    xpg.toString().indexOf('[Command Line API]') === -1
  ) {
    return function(xpathQuery, startElem) {
      const elems = xpq(xpathQuery, startElem);
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
 * @param {function(string, ?HTMLElement | ?Document)} cliXPG
 * @return {function(string, ): Array<HTMLElement>}
 */
export function maybePolyfillXPG(cliXPG) {
  if (
    typeof cliXPG !== 'function' ||
    cliXPG.toString().indexOf('[Command Line API]') === -1
  ) {
    return function(xpathQuery, startElem) {
      if (startElem == null) {
        startElem = document;
      }
      const snapShot = document.evaluate(
        xpathQuery,
        startElem,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      const elements = [];
      let i = 0;
      let len = snapShot.snapshotLength;
      while (i < len) {
        elements.push(snapShot.snapshotItem(i));
        i += 1;
      }
      return elements;
    };
  }
  return cliXPG;
}

/**
 * @param {string} selector - the selector to be use
 * @param {Element|Node|HTMLElement|Document} [context] - element to use rather than document for the querySelector call
 * @returns {Element | Node | HTMLElement | HTMLIFrameElement}
 */
export function qs(selector, context) {
  if (context != null) return context.querySelector(selector);
  return document.querySelector(selector);
}

/**
 * @param {string} selector - the selector to be use
 * @param {Element | Node | HTMLElement | Document} [context]
 * @returns {NodeList<Element | Node | HTMLElement>}
 */
export function qsa(selector, context) {
  if (context != null) return context.querySelectorAll(selector);
  return document.querySelectorAll(selector);
}

/**
 * @param {string} eid
 * @param {?Document} [context]
 * @returns {?HTMLElement}
 */
export function id(eid, context) {
  if (context != null) return context.getElementById(eid);
  return document.getElementById(eid);
}

/**
 * @param {string} selector - the selector to be use
 * @param {Element | Node | HTMLElement} [context] - element to use rather than document for the querySelector call
 * @returns {boolean}
 */
export function maybeRemoveElem(selector, context) {
  const elem = qs(selector, context);
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
export function maybeRemoveElemById(id) {
  const elem = document.getElementById(id);
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
export function elemHasNonZeroTopOffset(elem) {
  return elem.offsetTop !== 0;
}

/**
 * @param {HTMLElement | Element | Node} elem
 * @param {string} [marker = 'wrvistited']
 */
export function markElemAsVisited(elem, marker = 'wrvistited') {
  if (elem != null) {
    elem.classList.add(marker);
  }
}

export function addBehaviorStyle(styleDef) {
  if (document.getElementById('$wrStyle$') == null) {
    const style = document.createElement('style');
    style.id = '$wrStyle$';
    style.textContent = styleDef;
    document.head.appendChild(style);
  }
}

/**
 * @param {HTMLIFrameElement} iframe
 * @return {boolean}
 */
export function canAcessIf(iframe) {
  if (iframe == null) return false;
  try {
    iframe.contentWindow.window;
  } catch (e) {
    return false;
  }
  return iframe.contentDocument != null;
}

/**
 * @param {string} selector
 * @param {Document | Element} [cntx]
 * @return {boolean}
 */
export function selectorExists(selector, cntx) {
  return qs(selector, cntx) != null;
}

/**
 * @param {string} eid
 * @param {Document | Element} [cntx]
 * @return {boolean}
 */
export function idExists(eid, cntx) {
  return id(eid, cntx) != null;
}

/**
 * @param {function(xpathQuery: string, startElem: ?Node): Node[]} xpg
 * @param {string} tag
 * @param {function(elem: Node): boolean} predicate
 * @param {Document} [cntx]
 * @return {?Element|?HTMLIFrameElement|?Node}
 */
export function findTag(xpg, tag, predicate, cntx) {
  const tags = xpg(`//${tag}`, cntx || document);
  const len = tags.length;
  let i = 0;
  for (; i < len; ++i) {
    if (predicate(tags[i])) return tags[i];
  }
  return null;
}

/**
 * @param {Element} elem
 * @param {string} attr
 * @return {?string|?Object}
 */
export function attr(elem, attr) {
  if (elem) return elem.getAttribute(attr);
  return null;
}

/**
 * @param {Element} elem
 * @param {string} attr
 * @param {*} shouldEq
 * @return {boolean}
 */
export function attrEq(elem, attr, shouldEq) {
  if (elem) return elem.getAttribute(attr) == shouldEq;
  return false;
}

/**
 * @param {Document|Element} elem
 * @param {number} nth
 * @return {?Element}
 */
export function nthChildElemOf(elem, nth) {
  if (elem && elem.children && elem.children.length >= nth) {
    return elem.children[nth - 1];
  }
  return null;
}
