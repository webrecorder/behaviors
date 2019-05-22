import { camelCase } from './strings';

/**
 * @desc Returns the results of evaluating the supplied
 * xpath query using an optional context `contextElement`, defaults
 * to document, as XPathResult.ORDERED_NODE_SNAPSHOT_TYPE
 * @param {string} xpathQuery - The xpath query to be evaluated
 * @param {Element|Document} [contextElement] - Optional
 * element to be used as the context of the evaluation
 * @return {XPathResult} - The results of the xpath query evaluation
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate
 */
export function xpathSnapShot(xpathQuery, contextElement) {
  if (contextElement == null) {
    contextElement = document;
  }
  return document.evaluate(
    xpathQuery,
    contextElement,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
}

/**
 * @desc Provides the same functionality of the chrome console utility `$x`
 * but likely less performant
 * @param {string} xpathQuery - The xpath query to be evaluated
 * @param {Element|Document} [contextElement] - Optional
 * element to be used as the context of the evaluation
 * @return {Array<HTMLElement>} - The results of the xpath query evaluation
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate
 * @see https://developers.google.com/web/tools/chrome-devtools/console/utilities
 */
export function xpathSnapShotArray(xpathQuery, contextElement) {
  const snapShot = xpathSnapShot(xpathQuery, contextElement);
  const elements = [];
  const len = snapShot.snapshotLength;
  for (var i = 0; i < len; i++) {
    elements.push(snapShot.snapshotItem(i));
  }
  return elements;
}

/**
 * @desc Ensures that if the value of the chrome console utility $x
 * is not the actual utility (jquery is on the page) the returned
 * function behaves exactly like it.
 * @param {function(...*): Array<HTMLElement>} cliXPG
 * @return {function(...*): Array<HTMLElement>}
 */
export function maybePolyfillXPG(cliXPG) {
  if (
    typeof cliXPG === 'function' &&
    cliXPG.toString().includes('[Command Line API]')
  ) {
    return cliXPG;
  }
  return xpathSnapShotArray;
}

/**
 * @desc Utility function for `(document||element).querySelector(selector)`
 * @param {string} selector - the selector to be use
 * @param {Element|Node|HTMLElement|Document} [context] - element to use rather than document for the querySelector call
 * @return {SomeElement}
 */
export function qs(selector, context) {
  if (context != null) return context.querySelector(selector);
  return document.querySelector(selector);
}

/**
 * @desc Utility function for `(document||element).querySelector(selector)`
 * @param {string} selector - the selector to be use
 * @param {function(SomeElement): boolean} filterFn
 * @param {Element|Node} [context]
 * @return {Element|Node|HTMLElement|HTMLIFrameElement}
 */
export function filteredQs(selector, filterFn, context) {
  const elem = qs(selector, context);
  if (elem == null) return null;
  if (elem && filterFn(elem)) return elem;
  return null;
}

/**
 * @desc Utility function for `document.querySelectorAll(selector)`
 * @param {string} selector - the selector to be use
 * @param {Element|HTMLElement|Document} [context] - element to use rather than document for the querySelector call
 * @return {NodeList<Element|Node|HTMLElement>}
 */
export function qsa(selector, context) {
  if (context != null) return context.querySelectorAll(selector);
  return document.querySelectorAll(selector);
}

/**
 * @desc Utility function for `document.getElementById(id)`
 * @param {string} eid - The id of the element to get
 * @param {?Document} [context] - Optional document element to use rather than
 * the current JS context's
 * @return {?HTMLElement}
 */
export function id(eid, context) {
  if (context != null) return context.getElementById(eid);
  return document.getElementById(eid);
}

/**
 * @desc Removes the element selected by the supplied querySelector, if it exits,
 * returning true to indicate the element was removed and false otherwise
 * @param {string} selector - the selector to be use
 * @param {Element|Node|HTMLElement} [context] - element to use rather than document for the querySelector call
 * @return {boolean}
 */
export function maybeRemoveElem(selector, context) {
  const elem = qs(selector, context);
  if (elem) {
    elem.remove();
    return true;
  }
  return false;
}

/**
 * @desc Removes the element with the supplied id, if it exits, returning
 * true to indicate the element was removed and false otherwise
 * @param {string} eid - The id of the element to remove
 * @param {?Document} [context] - Optional document element to use rather than
 * the current JS context's
 * @return {boolean}
 */
export function maybeRemoveElemById(eid, context) {
  const elem = id(eid, context);
  if (elem) {
    elem.remove();
    return true;
  }
  return false;
}

/**
 * @desc Returns true if the supplied elements `offsetTop === 0`
 * @param {Element|HTMLElement|Node} elem - The element to check its
 * offsetTop
 * @return {boolean}
 */
export function elemOffsetTopZero(elem) {
  return elem.offsetTop === 0;
}

/**
 * @desc Marks the supplied element as visited by adding the marker
 * to its classList.
 * @param {HTMLElement|Element|Node} elem - The element to mark
 * as visited
 * @param {string} [marker = 'wrvistited'] - Optional marker to use
 * defaults to `wrvistited`
 */
export function markElemAsVisited(elem, marker = 'wrvistited') {
  if (elem != null) {
    elem.classList.add(marker);
  }
}

/**
 * @desc Creates a style tag if one was not created before and adds
 * the supplied `styleDef` to it. If a style tag was created before
 * this function is a no-op
 * @param {string} styleDef - The CSS rules to add
 * @return {Object} - An object containing the selectors as key value pairs
 * where the keys are the selectors in camelcase and the value is the raw selector
 */
export function addBehaviorStyle(styleDef) {
  let style = document.getElementById('$wrStyle$');
  if (style == null) {
    style = document.createElement('style');
    style.id = '$wrStyle$';
    style.textContent = styleDef;
    document.head.appendChild(style);
  }
  const rules = style.sheet.rules;
  let ruleIdx = rules.length;
  let selector;
  const classes = {};
  while (ruleIdx--) {
    selector = rules[ruleIdx].selectorText.replace('.', '');
    classes[camelCase(selector)] = selector;
  }
  return classes;
}

/**
 * @desc Determines if the supplied iframe is accessible from this
 * origin. Test is that access the window object of the iframes contentWindow
 * does not throw an exception and the contentDocument is not falsy.
 * @param {HTMLIFrameElement} iframe - The iframe to determine accessibility
 * @return {boolean} - True if the iframe is accessible and false otherwise
 */
export function canAccessIf(iframe) {
  if (iframe == null) return false;
  try {
    iframe.contentWindow.window;
  } catch (e) {
    return false;
  }
  return iframe.contentDocument != null;
}

/**
 * @desc Determines if the element the supplied selector selects exists
 * @param {string} selector - The querySelector to use for testing if
 * the element it selects exists
 * @param {Document|Element} [cntx] - Optional element to use rather
 * than the current JS context's document object
 * @return {boolean} - True if the element exists, false otherwise
 */
export function selectorExists(selector, cntx) {
  return qs(selector, cntx) != null;
}

/**
 * @desc Determines if the element the supplied id identifies exists
 * @param {string} eid - The id of the element
 * @param {Document} [cntx] - Optional document object to use rather
 * than the current JS context's document object
 * @return {boolean} - True if the element exists, false otherwise
 */
export function idExists(eid, cntx) {
  return id(eid, cntx) != null;
}

/**
 * @desc Attempts to find a tag using the supplied function that accepts
 * an xpath query and an optional starting element and returns
 * the element the supplied predicate function returns a truthy value for
 * @param {function(string, ?Node): Node[]} xpg - xpath execution function
 * @param {string} tag - The tag to be found
 * @param {function(Node): boolean} predicate - Element selecting predicate function
 * @param {Document|Node} [cntx] - Optional starting element, defaults to `document`
 * @return {?Element|?HTMLIFrameElement|?Node} - The desired element if it was found
 */
export function findTag(xpg, tag, predicate, cntx) {
  const tags = xpg(`//${tag}`, cntx || document);
  const len = tags.length;
  for (var i = 0; i < len; ++i) {
    if (predicate(tags[i])) return tags[i];
  }
  return null;
}

/**
 * @desc Retrieves the value of an elements attribute if it exists
 * @param {Element} elem - The element to retrieve an attribute from
 * @param {string} attr - The name of the attribute to be retrieved
 * @return {?string|?Object} - The value of the retrieved attribute if it exists
 */
export function attr(elem, attr) {
  if (elem) return elem.getAttribute(attr);
  return null;
}

/**
 * @desc Tests to determine if the value of elements attribute equals
 * the supplied value using loose equality
 * @param {Element} elem - The element to retrieve an attribute from
 * @param {string} attr - The name of the attribute to be retrieved
 * @param {*} shouldEq - The value the attributes value should equal
 * @return {boolean} - T/F indicating if the attribute equals. Note
 * false can indicate the attribute does not equal expected or
 * the element was null/undefined
 */
export function attrEq(elem, attr, shouldEq) {
  if (elem) return elem.getAttribute(attr) == shouldEq;
  return false;
}

/**
 * @desc Returns the Nth child of the supplied element (indexing assumes start is 1)
 * @param {Element|Document} elem - The element to retrieve the nth child of
 * @param {number} nth - The number of the nth child
 * @return {?Element} - The nth child if it exists
 */
export function nthChildElemOf(elem, nth) {
  if (elem && elem.children && elem.children.length >= nth) {
    return elem.children[nth - 1];
  }
  return null;
}

/**
 *
 * @param {Element} startingElem
 * @param {...number} nths
 * @return {?Element}
 */
export function chainNthChildElemOf(startingElem, ...nths) {
  let child = startingElem;
  if (
    startingElem != null &&
    startingElem.children != null &&
    startingElem.children.length
  ) {
    const length = nths.length;
    for (var i = 0; i < length; ++i) {
      child = nthChildElemOf(child, nths[i]);
      if (child == null) break;
    }
  }
  return child;
}

/**
 *
 * @param {Element} elem
 * @returns {?Element}
 */
export function firstChildElementOf(elem) {
  if (elem != null) return elem.firstElementChild;
  return null;
}

/**
 *
 * @param {string} selector
 * @param {Document|Node} [cntx] - Optional starting element, defaults to `document`
 * @returns {?Element}
 */
export function firstChildElementOfSelector(selector, cntx) {
  return firstChildElementOf(qs(selector, cntx));
}

/**
 *
 * @param {Element} elem
 * @param {number} times
 * @returns {?Element}
 */
export function chainFistChildElemOf(elem, times) {
  let child = elem;
  if (elem != null) {
    for (var i = 0; i < times; ++i) {
      child = firstChildElementOf(child);
      if (child == null) break;
    }
  }
  return child;
}

/**
 *
 * @param {?Element} elem
 * @returns {?Element}
 */
export function lastChildElementOf(elem) {
  if (elem != null) return elem.lastElementChild;
  return null;
}

/**
 *
 * @param {string} selector
 * @param {Document|Node} [cntx] - Optional starting element, defaults to `document`
 * @returns {?Element}
 */
export function lastChildElementOfSelector(selector, cntx) {
  return lastChildElementOf(qs(selector, cntx));
}

/**
 *
 * @param {Element} elem
 * @param {number} times
 * @returns {?Element}
 */
export function chainLastChildElemOf(elem, times) {
  let child = elem;
  if (elem != null && elem.children && elem.children.length) {
    for (var i = 0; i < times; ++i) {
      child = lastChildElementOf(child);
      if (child == null) break;
    }
  }
  return child;
}

/**
 *
 * @param {Element} elem
 * @return {number}
 */
export function numElemChildren(elem) {
  if (elem != null) {
    return elem.childElementCount;
  }
  return -1;
}

/**
 * @desc Consecutively calls querySelector(selector) on the element returned by the previous invocation
 * @param {Element|Node|Document} startingSelectFrom - The first element to perform querySelector(startingSelector) on
 * @param {string} startingSelector - The first selector
 * @param {...string} selectors - Additional selections
 * @return {?Element} - Final selected element if it exists
 */
export function chainQs(startingSelectFrom, startingSelector, ...selectors) {
  let selected = qs(startingSelector, startingSelectFrom);
  if (selected != null) {
    const len = selectors.length;
    for (var i = 0; i < len; ++i) {
      selected = qs(selectors[i], selected);
      if (selected == null) return null;
    }
  }
  return selected;
}

/**
 * @desc Adds a CSS classname to the supplied element
 * @param {?Element} elem - The element to add the classname to
 * @param {string} clazz - The classname to be added
 */
export function addClass(elem, clazz) {
  if (elem) {
    elem.classList.add(clazz);
  }
}

/**
 * @desc Removes a CSS classname to the supplied element
 * @param {?Element} elem - The element to remove the classname to
 * @param {string} clazz - The classname to be removed
 */
export function removeClass(elem, clazz) {
  if (elem) {
    elem.classList.remove(clazz);
  }
}

/**
 * @desc Tests to see if the supplied element has a css class
 * @param {?SomeElement} elem - The element to be tested if it has the class
 * @param {string} clazz - The classname
 * @return {boolean} - T/F indicating if the element has the class
 */
export function hasClass(elem, clazz) {
  if (elem) return elem.classList.contains(clazz);
  return false;
}

/**
 *
 * @param {SomeElement} elem
 * @return {boolean}
 */
export function isClasslessElem(elem) {
  return elem.classList.length === 0;
}

/**
 * @desc Returns the supplied elements next element sibling
 * @param {SomeElement} elem - The element to receive its sibling
 * @return {?SomeElement} - The elements sibling if it exists
 */
export function getElemSibling(elem) {
  return elem.nextElementSibling;
}

/**
 *
 * @param {SomeElement} elem
 * @return {boolean}
 */
export function elemHasSibling(elem) {
  return getElemSibling(elem) != null;
}

/**
 * @desc Returns the supplied elements next element sibling and removes the
 * supplied element
 * @param {SomeElement} elem - The element to receive its sibling
 * @return {?SomeElement} - The elements sibling if it exists
 */
export function getElemSiblingAndRemoveElem(elem) {
  const sibling = getElemSibling(elem);
  elem.remove();
  return sibling;
}

/**
 * @desc Determines if the supplied elements bounding client rect's
 * x,y,width,height,top,left properties all equal zero.
 * Note this function returns true if the element is null/undefined;
 * @param {Element} elem - The element to be tested
 * @return {boolean} - T/F indicating if all zero or not.
 */
export function elemHasZeroBoundingRect(elem) {
  if (elem == null) return true;
  const rect = elem.getBoundingClientRect();
  return (
    rect.x === 0 &&
    rect.y === 0 &&
    rect.width === 0 &&
    rect.height === 0 &&
    rect.top === 0 &&
    rect.left === 0
  );
}

export function isElemNotVisible(elem) {
  if (elem == null) return true;
  return elem.hidden || elemHasZeroBoundingRect(elem);
}

/**
 * @desc Returns the Nth parent element of the supplied element (indexing assumes start is 1)
 * @param {Node} elem - The element to retrieve the nth parent element of
 * @param {number} nth - The number of the nth parent
 * @return {?HTMLElement} - The nth parent element if it exists
 */
export function getNthParentElement(elem, nth) {
  if (elem != null && elem.parentElement != null && nth >= 1) {
    let counter = nth - 1;
    let parent = elem.parentElement;
    while (counter > 0 && parent != null) {
      parent = parent.parentElement;
      counter--;
    }
    return parent;
  }
  return null;
}

/**
 *
 * @param {Node} elem
 * @param needle
 * @returns {boolean}
 */
export function elementTextContains(elem, needle) {
  if (elem != null && elem.textContent != null)
    return elem.textContent.includes(needle);
  return false;
}

/**
 *
 * @param {Node} elem
 * @param {string} shouldEqual
 * @returns {boolean}
 */
export function elementTextEqs(elem, shouldEqual) {
  if (elem != null) return elem.textContent === shouldEqual;
  return false;
}

/**
 *
 * @param {Node} elem
 * @param {string} start
 * @param {string} end
 * @returns {boolean}
 */
export function elementTextStartsWithAndEndsWith(elem, start, end) {
  return elementTextStartsWith(elem, start) && elementTextEndsWith(elem, end);
}

/**
 *
 * @param {Node} elem
 * @param {string} start
 * @returns {boolean}
 */
export function elementTextStartsWith(elem, start) {
  if (elem != null && elem.textContent != null) {
    return elem.textContent.startsWith(start);
  }
  return false;
}

/**
 *
 * @param {Node} elem
 * @param {string} end
 * @returns {boolean}
 */
export function elementTextEndsWith(elem, end) {
  if (elem != null && elem.textContent != null) {
    return elem.textContent.endsWith(end);
  }
  return false;
}

/**
 *
 * @param {HTMLElement} elem
 * @param {string} splitter
 * @returns {?Array<string>}
 */
export function splitElemInnerText(elem, splitter) {
  if (elem != null && elem.innerText != null) {
    return elem.innerText.split(splitter);
  }
  return null;
}

/**
 *
 * @param {Node} elem
 * @param {string} splitter
 * @returns {?Array<string>}
 */
export function splitElemTextContents(elem, splitter) {
  if (elem != null && elem.textContent != null) {
    return elem.textContent.split(splitter);
  }
  return null;
}

/**
 *
 * @param {HTMLElement} elem
 * @returns {?string}
 */
export function elemInnerText(elem) {
  if (elem != null && elem.innerText != null) return elem.innerText;
  return null;
}

/**
 *
 * @param elem
 * @param {string} shouldEqual
 * @param {boolean} [trim = false]
 * @return {boolean}
 */
export function elemInnerTextEqs(elem, shouldEqual, trim = false) {
  if (elem == null || elem.innerText == null) return false;
  const innerText = trim ? elem.innerText.trim() : elem.innerText;
  return innerText === shouldEqual;
}

/**
 *
 * @param elem
 * @param {...string} shouldEquals
 * @return {boolean}
 */
function elemInnerTextEqsOneOf(elem, ...shouldEquals) {
  if (elem != null && elem.innerText != null) return false;
  const innertText = elem.innerText;
  for (var i = 0; i < shouldEquals.length; ++i) {
    if (innertText === shouldEquals[i]) return true;
  }
  return false;
}

/**
 *
 * @param {Node} elem
 * @returns {?string}
 */
export function elemTextContent(elem) {
  if (elem != null && elem.textContent != null) return elem.textContent;
  return null;
}

/**
 * @param {?Document} doc
 * @return {{scrollTop: number, scrollLeft: number}}
 */
export function documentScrollPosition(doc) {
  const documentElem = doc != null ? doc : document;
  const elem = documentElem.body
    ? documentElem.body
    : documentElem.documentElement;
  return {
    scrollTop: elem.scrollTop,
    scrollLeft: elem.scrollLeft,
  };
}

/**
 * @desc Helper function to get the actual x and y position,
 * page x and y position (scroll) and the height, width of a given element
 * @param {Element} element
 * @param {Document} [doc]
 * @return {?{y: number, pageY: number, x: number, pageX: number, w: number, h: number}}
 */
export function getElementPositionWidthHeight(element, doc) {
  if (element == null) return null;
  const rect = element.getBoundingClientRect();
  const scrollPos = documentScrollPosition(doc);
  return {
    y: rect.top,
    x: rect.left,
    pageY: rect.top + scrollPos.scrollTop,
    pageX: rect.left + scrollPos.scrollLeft,
    w: rect.width,
    h: rect.height,
  };
}

/**
 * @desc Get the position of the passed DOM element
 * @param {Element} element
 * @param {Object} options
 * @return {{clientY: number, clientX: number, pageY: number, pageX: number}}
 */
export function getElementClientPagePosition(element, options) {
  const opts = Object.assign({ x: 1, y: 1, floor: false }, options);
  const cords = getElementPositionWidthHeight(element, opts.doc);
  const clientX = cords.x + (cords.w / 100) * opts.x;
  const clientY = cords.y + (cords.h / 100) * opts.y;
  const pageX = cords.pageX + (cords.w / 100) * opts.x;
  const pageY = cords.pageY + (cords.h / 100) * opts.y;
  return {
    clientX: opts.floor ? Math.floor(clientX) : clientX,
    clientY: opts.floor ? Math.floor(clientY) : clientY,
    pageX: opts.floor ? Math.floor(pageX) : pageX,
    pageY: opts.floor ? Math.floor(pageY) : pageY,
  };
}

/**
 * @desc Get the center of the passed DOM element
 * @param {Element} element
 * @param {{floor: boolean}} [options]
 * @return {?{clientY: number, clientX: number, pageY: number, pageX: number}}
 */
export function getElementClientPageCenter(element, options) {
  if (element == null) return null;
  const opts = Object.assign({ floor: false }, options);
  const cords = getElementPositionWidthHeight(element, opts.doc);
  const clientX = cords.x + cords.w / 2;
  const clientY = cords.y + cords.h / 2;
  const pageX = cords.pageX + cords.w / 2;
  const pageY = cords.pageY + cords.h / 2;
  return {
    clientX: opts.floor ? Math.floor(clientX) : clientX,
    clientY: opts.floor ? Math.floor(clientY) : clientY,
    pageX: opts.floor ? Math.floor(pageX) : pageX,
    pageY: opts.floor ? Math.floor(pageY) : pageY,
  };
}

/**
 * @desc Determines if the element the supplied selector selects exists.
 *
 * If one of the supplied selectors matches an existing element the idx property
 * of the returned object is set to the index of the selector in the array and
 * the success property is set to true.
 *
 * Otherwise idx = -1 and success = false.
 * @param {Array<string>} selectors - The query selectors to use for testing if
 * the elements it selects exist
 * @param {SomeElement} [cntx] - Optional element to use rather
 * than the current JS context's document object
 * @return {{idx: number, success: boolean}} - The results of the selectors
 * existence check
 */
export function anySelectorExists(selectors, cntx) {
  const numSelectors = selectors.length;
  for (var i = 0; i < numSelectors; ++i) {
    if (selectorExists(selectors[i], cntx)) {
      return { idx: i, success: true };
    }
  }
  return { idx: -1, success: false };
}

/**
 * @desc Returns T/F indicating if the elements name (localName) is equal to the supplied name
 * @param {Element} elem - The element to check if its name equals the supplied name
 * @param {string} name - The name of the desired element
 * @return {boolean}
 */
export function elementsNameEquals(elem, name) {
  if (!elem) return false;
  return elem.localName === name;
}

/**
 * @desc Returns T/F indicating if the nodes name (nodeName) is equal to the supplied name
 * @param {Node} node - The node to check if its name equals the supplied name
 * @param {string} name - The name of the desired Node
 * @return {boolean}
 */
export function nodesNameEquals(node, name) {
  if (!node) return false;
  return node.nodeName === name;
}

/**
 * @typedef {Object} XPathOnOfOpts
 * @property {Array<string>} queries
 * @property {*} xpg
 * @property {*} [context]
 */

/**
 * @desc Returns the results of evaluating one of the supplied xpath queries if
 * one of the queries yields results otherwise null/undefined
 * @param {XPathOnOfOpts} options
 * @return {?Array<*>}
 */
export function xpathOneOf({ queries, xpg, context }) {
  let results = null;
  for (var i = 0; i < queries.length; i++) {
    results = xpg(queries[i], context);
    if (results) return results;
  }
  return results;
}

/**
 * @desc Returns the results of querySelector using one of the supplied selectors
 * one if one of the selectors yields results otherwise null/undefined
 * @param {{selectors: Array<string>, context: *}} options
 * @return {?Element}
 */
export function qsOneOf({ selectors, context }) {
  if (selectors == null) return null;
  let results = null;
  for (var i = 0; i < selectors.length; i++) {
    results = qs(selectors[i], context);
    if (results) return results;
  }
  return results;
}

/**
 * @desc Returns the results of querySelectorAll using one of the supplied
 * selectors if one of the selectors yields results otherwise null/undefined
 * @param {{selectors: Array<string>, context: *}} options
 * @return {?NodeList<SomeElement>}
 */
export function qsaOneOf({ selectors, context }) {
  if (selectors == null) return null;
  let results = null;
  for (var i = 0; i < selectors.length; i++) {
    results = qsa(selectors[i], context);
    if (results) return results;
  }
  return results;
}

/**
 * @desc Returns the next element sibling of the supplied selector IFF
 * the selector returns a results and the next element sibling exists
 * otherwise null/undefined
 * @param {string} selector - The selector for the element who's next sibling is
 * to be returned
 @param {Element|Node|HTMLElement|Document} [context] - element to use rather than document for the querySelector call
 * @return {?Element}
 */
export function selectedNextElementSibling(selector, context) {
  const maybeSelected = qs(selector, context);
  if (maybeSelected && maybeSelected.nextElementSibling) {
    return maybeSelected.nextElementSibling;
  }
  return null;
}

/**
 * Returns T/F indicating if the documents baseURI ends with the supplied string
 * @param {string} shouldEndWith - What the documents base URI should end with
 * @param {Document} [cntxDoc] - Optional document object to use rather than
 * defaulting to the current execution contexts document object
 * @return {boolean}
 */
export function docBaseURIEndsWith(shouldEndWith, cntxDoc) {
  if (!shouldEndWith) return false;
  return (cntxDoc || document).baseURI.endsWith(shouldEndWith);
}

/**
 * Returns T/F indicating if the documents baseURI equals the supplied string
 * @param {string} shouldEqual - What the documents base URI should be equal to
 * @param {Document} [cntxDoc] - Optional document object to use rather than
 * defaulting to the current execution contexts document object
 * @return {boolean}
 */
export function docBaseURIEquals(shouldEqual, cntxDoc) {
  if (!shouldEqual) return false;
  return (cntxDoc || document).baseURI === shouldEqual;
}

/**
 * Repeatably performs the supplied xpath query yielding the results
 * of the each query. If an empty result set is encountered and generateMoreElements
 * function was supplied it is called and the query repeated. If the second query
 * try yields another empty set the iterator ends
 * @param {string} query
 * @param [cntx]
 * @param {function(): void} [generateMoreElements]
 * @return {IterableIterator<Node>}
 */
export function* repeatedXpathQueryIterator(query, cntx, generateMoreElements) {
  let snapShot = xpathSnapShot(query, cntx);
  let i;
  while (snapShot.snapshotLength > 0) {
    for (i = 0; i < snapShot.snapshotLength; i++) {
      yield snapShot.snapshotItem(i);
    }
    snapShot = xpathSnapShot(query, cntx);
    if (snapShot.snapshotLength === 0) {
      generateMoreElements();
      snapShot = xpathSnapShot(query, cntx);
    }
  }
}

/**
 * Repeatably performs the supplied xpath query yielding the results
 * of the each query. If an empty result set is encountered and generateMoreElements
 * function was supplied it is called and the query repeated. If the second query
 * try yields another empty set the iterator ends
 * @param {string} query
 * @param [cntx]
 * @param {function(): Promise<void>} [generateMoreElements]
 * @return {AsyncIterableIterator<Node>}
 */
export async function* repeatedXpathQueryIteratorAsync(
  query,
  cntx,
  generateMoreElements
) {
  let snapShot = xpathSnapShot(query, cntx);
  let i;
  while (snapShot.snapshotLength > 0) {
    for (i = 0; i < snapShot.snapshotLength; i++) {
      yield snapShot.snapshotItem(i);
    }
    snapShot = xpathSnapShot(query, cntx);
    if (snapShot.snapshotLength === 0) {
      await generateMoreElements();
      snapShot = xpathSnapShot(query, cntx);
    }
  }
}

/**
 * @typedef {Element|Node|HTMLElement|Document} SomeElement
 **/
