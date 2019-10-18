import { camelCase } from './strings';
import { isFunction, isPromise, promiseResolveReject } from './general';

/**
 * Returns the results of evaluating the supplied
 * xpath query using an optional context `contextElement`, defaults
 * to document, as XPathResult.NUMBER_TYPE
 * @param {string} xpathQuery - The xpath query to be evaluated
 * @param {SomeElement|Document} [contextElement] - Optional
 * element to be used as the context of the evaluation
 * @return {number}
 */
export function xpathNumberQuery(xpathQuery, contextElement) {
  const result = document.evaluate(
    xpathQuery,
    contextElement || document,
    null,
    XPathResult.NUMBER_TYPE,
    null
  );
  return result.numberValue;
}

/**
 * Returns the results of evaluating the supplied
 * xpath query using an optional context `contextElement`, defaults
 * to document, as XPathResult.ORDERED_NODE_SNAPSHOT_TYPE
 * @param {string} xpathQuery - The xpath query to be evaluated
 * @param {SomeElement|Document} [contextElement] - Optional
 * element to be used as the context of the evaluation
 * @return {XPathResult} - The results of the xpath query evaluation
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate
 */
export function xpathSnapShot(xpathQuery, contextElement) {
  return document.evaluate(
    xpathQuery,
    contextElement || document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
}

/**
 * Provides the same functionality of the chrome console utility `$x`
 * but likely less performant
 * @param {string} xpathQuery - The xpath query to be evaluated
 * @param {SomeElement|Document} [contextElement] - Optional
 * element to be used as the context of the evaluation
 * @return {Array<SomeElement>} - The results of the xpath query evaluation
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
 * Ensures that if the value of the chrome console utility $x
 * is not the actual utility (jquery is on the page) the returned
 * function behaves exactly like it.
 * @param {function(...args: *): Array<SomeElement>} cliXPG
 * @return {function(...args: *): Array<SomeElement>}
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
 * Utility function for `(document||element).querySelector(selector)`
 * @param {string} selector - the selector to be use
 * @param {SomeElement|Document} [context] - element to use rather than document for the querySelector call
 * @return {?SomeElement}
 */
export function qs(selector, context) {
  if (context != null) return context.querySelector(selector);
  return document.querySelector(selector);
}

/**
 * Utility function for `(document||element).querySelector(selector)`
 * @param {string} selector - the selector to be use
 * @param {function(elem: SomeElement): boolean} filterFn
 * @param {SomeElement|Document} [context] - element to use rather than document for the querySelector call
 * @return {?SomeElement}
 */
export function filteredQs(selector, filterFn, context) {
  const elem = qs(selector, context);
  if (elem == null) return null;
  if (elem && filterFn(elem)) return elem;
  return null;
}

/**
 * Utility function for `document.querySelectorAll(selector)`
 * @param {string} selector - the selector to be use
 * @param {SomeElement|Document} [context] - element to use rather than document for the querySelector call
 * @return {NodeList<SomeElement>}
 */
export function qsa(selector, context) {
  if (context != null) return context.querySelectorAll(selector);
  return document.querySelectorAll(selector);
}

/**
 * Returns an iterator over the results of calling {@link qsa} with the supplied
 * selector and optional context element until the call to {@link qsa} returns no more results
 * @param {string} selector - the selector to be use
 * @param {SomeElement|Document} [context] - element to use rather than document for the querySelector call
 * @return {IterableIterator<SomeElement>}
 */
export function* repeatedQSAIterator(selector, context) {
  let results = qsa(selector, context);
  while (results.length) {
    for (let i = 0; i < results.length; i++) {
      yield results[i];
    }
    results = qsa(selector, context);
  }
}

/**
 * Utility function for `document.getElementById(id)`
 * @param {string} eid - The id of the element to get
 * @param {SomeElement|Document} [context] - Optional document element to use rather than
 * the current JS context's
 * @return {?SomeElement}
 */
export function id(eid, context) {
  if (context != null) return context.getElementById(eid);
  return document.getElementById(eid);
}

/**
 * Removes the element selected by the supplied querySelector, if it exits,
 * returning true to indicate the element was removed and false otherwise
 * @param {string} selector - the selector to be use
 * @param {SomeElement|Document} [context] - element to use rather than document for the querySelector call
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
 * Removes the element with the supplied id, if it exits, returning
 * true to indicate the element was removed and false otherwise
 * @param {string} eid - The id of the element to remove
 * @param {SomeElement|Document} [context] - Optional document element to use rather than
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
 * Returns true if the supplied elements `offsetTop === 0`
 * @param {SomeElement} elem - The element to check its
 * offsetTop
 * @return {boolean}
 */
export function elemOffsetTopZero(elem) {
  return elem.offsetTop === 0;
}

/**
 * Marks the supplied element as visited by adding the marker
 * to its classList.
 * @param {SomeElement} elem - The element to mark
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
 * Creates a style tag if one was not created before and adds
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
    document.head.appendChild(style);
  }
  style.textContent = styleDef;
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
 * Determines if the supplied iframe is accessible from this
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
 * Determines if the element the supplied selector selects exists
 * @param {string} selector - The querySelector to use for testing if
 * the element it selects exists
 * @param {Document|SomeElement} [cntx] - Optional element to use rather
 * than the current JS context's document object
 * @return {boolean} - True if the element exists, false otherwise
 */
export function selectorExists(selector, cntx) {
  return qs(selector, cntx) != null;
}

/**
 * Determines if the element the supplied id identifies exists
 * @param {string} eid - The id of the element
 * @param {Document} [cntx] - Optional document object to use rather
 * than the current JS context's document object
 * @return {boolean} - True if the element exists, false otherwise
 */
export function idExists(eid, cntx) {
  return id(eid, cntx) != null;
}

/**
 * Attempts to find a tag using the supplied function that accepts
 * an xpath query and an optional starting element and returns
 * the element the supplied predicate function returns a truthy value for
 * @param {function(query: string, node: ?Node): Node[]} xpg - xpath execution function
 * @param {string} tag - The tag to be found
 * @param {function(elem: SomeElement): boolean} predicate - Element selecting predicate function
 * @param {Document|SomeElement} [cntx] - Optional starting element, defaults to `document`
 * @return {?SomeElement} - The desired element if it was found
 */
export function findTag(xpg, tag, predicate, cntx) {
  const tags = xpg(`//${tag}`, cntx || document);
  for (var i = 0; i < tags.length; ++i) {
    if (predicate(tags[i])) return tags[i];
  }
  return null;
}

/**
 * Retrieves the value of an elements attribute if it exists
 * @param {SomeElement} elem - The element to retrieve an attribute from
 * @param {string} attr - The name of the attribute to be retrieved
 * @return {*} - The value of the retrieved attribute if it exists
 */
export function attr(elem, attr) {
  if (elem) return elem.getAttribute(attr);
  return null;
}

/**
 * Tests to determine if the value of elements attribute equals
 * the supplied value using loose equality
 * @param {SomeElement} elem - The element to retrieve an attribute from
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
 * Returns the Nth child node of the supplied element (indexing assumes start is 1)
 * @param {SomeElement|Document} elem - The element to retrieve the nth child of
 * @param {number} nth - The number of the nth child
 * @return {?SomeElement} - The nth child if it exists
 */
export function nthChildNodeOf(elem, nth) {
  if (elem && elem.children && elem.children.length >= nth) {
    return elem.childNodes[nth - 1];
  }
  return null;
}

/**
 * Chains {@link nthChildNodeOf} for each nth child in `nths`
 * @param {SomeElement} startingElem - The starting parent element
 * @param {...number} nths - The consecutive nth child node
 * @return {?SomeElement}
 * @example
 * // child is the parent elements 3rd child node's 4th child node's 5th child node
 * const child = chainNthChildNodeOf(parentElement, 3, 4, 5);
 */
export function chainNthChildNodeOf(startingElem, ...nths) {
  if (elemHasChildren(startingElem)) {
    let child = startingElem;
    for (var i = 0; i < nths.length; ++i) {
      child = nthChildNodeOf(child, nths[i]);
      if (child == null) break;
    }
    return child;
  }
  return null;
}

/**
 * Returns the first child element of the supplied elements parent element.
 * If the supplied element or the elements parent is null/undefined null is returned
 * @param {?SomeElement} elem - The element who's parents first child is desired
 * @return {?SomeElement}
 */
export function firstChildElemOfParent(elem) {
  if (elem == null || elem.parentElement == null) return null;
  return elem.parentElement.firstElementChild;
}

/**
 * Returns the supplied elements first element child. If the element is null
 * null is returned
 * @param {?SomeElement} elem - The element who's first child is desired
 * @returns {?SomeElement}
 */
export function firstChildElementOf(elem) {
  if (elem != null) return elem.firstElementChild;
  return null;
}

/**
 * Returns the first child element of the element matching the supplied selector
 * @param {string} selector - The selector to match the parent element of the desired child
 * @param {Document|SomeElement} [cntx] - Optional starting element, defaults to `document`
 * @returns {?SomeElement}
 */
export function firstChildElementOfSelector(selector, cntx) {
  return firstChildElementOf(qs(selector, cntx));
}

/**
 * Returns the nth previous sibling of the supplied element if it is not null/undefined or the supplied element is not null/undefined
 * @param {?SomeElement} elem - The element who's nth previous sibling is desired
 * @param {number} nth - The nth previous sibling
 * @return {SomeElement}
 */
export function nthPreviousSibling(elem, nth) {
  let prevSibling = elem;
  for (let i = 0; i < nth; i++) {
    if (!prevSibling) break;
    prevSibling = prevSibling.previousElementSibling;
  }
  return prevSibling;
}

/**
 * Returns the Nth child element of the supplied element (indexing assumes start is 1)
 * @param {SomeElement|Document} elem - The element to retrieve the nth child element of
 * @param {number} nth - The number of the nth child element
 * @return {?SomeElement} - The nth child if it exists
 */
export function nthChildElementOf(elem, nth) {
  if (!elem || !elem.firstElementChild) return null;
  let child = elem.firstElementChild;
  for (let i = 1; i < nth; i++) {
    child = child.nextElementSibling;
    if (!child) break;
  }
  return child;
}

/**
 * Chains {@link nthChildElementOf} for each nth child element in `nths`
 * @param {SomeElement} elem - The starting parent element
 * @param {...number} nths - The consecutive nth child node
 * @return {?SomeElement}
 * @example
 * // child is the parent elements 3rd child element's 4th child element's 5th child element
 * const child = chainNthChildElementOf(parentElement, 3, 4, 5);
 */
export function chainNthChildElementOf(elem, ...nths) {
  let child = elem;
  for (let i = 0; i < nths.length; i++) {
    child = nthChildElementOf(child, nths[i]);
    if (!child) break;
  }
  return child;
}

/**
 * Chains {@link firstChildElementOf} on the supplied element n `times`
 * @param {SomeElement} elem - The starting element
 * @param {number} times - How many times to call {@link firstChildElementOf}
 * @returns {?SomeElement}
 */
export function chainFistChildElemOf(elem, times) {
  if (elem == null) return null;
  let child = elem;
  for (var i = 0; i < times; ++i) {
    child = firstChildElementOf(child);
    if (child == null) break;
  }
  return child;
}

/**
 * Returns the last child element of the supplied element
 * @param {?SomeElement} elem - The element who's last child element is desired
 * @returns {?SomeElement}
 */
export function lastChildElementOf(elem) {
  if (elem != null) return elem.lastElementChild;
  return null;
}

/**
 * Returns the last child element of the element the selector selects
 * @param {string} selector - The selector to be used to select the element who's last child element is desired
 * @param {Document|SomeElement} [cntx] - Optional starting element, defaults to `document`
 * @returns {?SomeElement}
 */
export function lastChildElementOfSelector(selector, cntx) {
  return lastChildElementOf(qs(selector, cntx));
}

/**
 * Chains {@link lastChildElementOf} n `times` starting with the supplied element
 * @param {SomeElement} elem - The starting parent element who
 * @param {number} times - How many times should the
 * @returns {?SomeElement}
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
 * Returns the number of child elements the supplied element has if it is not
 * null/undefined otherwise -1
 * @param {SomeElement} elem - The element who's child element count is deired
 * @return {number}
 */
export function numElemChildren(elem) {
  if (elem != null) {
    return elem.childElementCount;
  }
  return -1;
}

/**
 * Consecutively calls querySelector(selector) on the element returned by the previous invocation
 * @param {SomeElement|Document} startingSelectFrom - The first element to perform querySelector(startingSelector) on
 * @param {string} startingSelector - The first selector
 * @param {...string} selectors - Additional selections
 * @return {?SomeElement} - Final selected element if it exists
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
 * Adds a CSS classname to the supplied element
 * @param {?SomeElement} elem - The element to add the classname to
 * @param {string} clazz - The classname to be added
 */
export function addClass(elem, clazz) {
  if (elem) {
    elem.classList.add(clazz);
  }
}

/**
 * Removes a CSS classname to the supplied element
 * @param {?SomeElement} elem - The element to remove the classname to
 * @param {string} clazz - The classname to be removed
 */
export function removeClass(elem, clazz) {
  if (elem) {
    elem.classList.remove(clazz);
  }
}

/**
 * Tests to see if the supplied element has a css class
 * @param {?SomeElement} elem - The element to be tested if it has the class
 * @param {string} clazz - The classname
 * @return {boolean} - T/F indicating if the element has the class
 */
export function hasClass(elem, clazz) {
  if (elem) return elem.classList.contains(clazz);
  return false;
}

/**
 * Tests to see if the supplied element has the supplied css classes
 * @param {?SomeElement} elem - The element to be tested if it has the classes
 * @param {...string} classes - The classes the element must have
 * @return {boolean} - T/F indicating if the element has the classes
 */
export function hasClasses(elem, ...classes) {
  if (!elem) return false;
  for (let i = 0; i < classes.length; i++) {
    if (!elem.classList.contains(classes[i])) return false;
  }
  return true;
}

/**
 * Tests to see if the supplied element has any of the supplied css classes
 * @param {?SomeElement} elem - The element to be tested if it has any of the classes
 * @param {...string} classes - The classes the element can have
 * @return {boolean} - T/F indicating if the element has any of the classes
 */
export function hasAnyClass(elem, ...classes) {
  if (!elem) return false;
  for (let i = 0; i < classes.length; i++) {
    if (elem.classList.contains(classes[i])) return true;
  }
  return false;
}

/**
 * Returns T/F indicating if the element matches the supplied selector
 * @param {SomeElement} elem
 * @param {string} selector
 * @return {boolean}
 */
export function elemMatchesSelector(elem, selector) {
  if (!elem) return false;
  return elem.matches(selector);
}

/**
 * Returns T/F indicating if the supplied element has not CSS classes
 * @param {SomeElement} elem
 * @return {boolean}
 */
export function isClasslessElem(elem) {
  return elem.classList.length === 0;
}

/**
 * Returns the supplied elements next element sibling
 * @param {SomeElement} elem - The element to receive its sibling
 * @return {?SomeElement} - The elements sibling if it exists
 */
export function getElemSibling(elem) {
  if (!elem) return null;
  return elem.nextElementSibling;
}

/**
 * Returns the next element sibling of the parent element of the
 * supplied element
 * @param {SomeElement} elem - The element to receive its sibling
 * @return {?SomeElement} - The elements sibling if it exists
 */
export function getElemsParentsSibling(elem) {
  if (!elem) return null;
  return getElemSibling(elem.parentElement);
}

/**
 * Returns T/F indicating if the supplied element has an sibling element
 * @param {SomeElement} elem
 * @return {boolean}
 */
export function elemHasSibling(elem) {
  return getElemSibling(elem) != null;
}

/**
 * Returns the supplied elements next element sibling and removes the
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
 * Determines if the supplied elements bounding client rect's
 * x,y,width,height,top,left properties all equal zero.
 * Note this function returns true if the element is null/undefined;
 * @param {SomeElement} elem - The element to be tested
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

/**
 * Returns T/F indicating if the supplied element is visible.
 *
 * If the supplied element is falsy the return value is false.
 *
 * The test checks the computed style of the supplied element
 * to determine if it's css display property is not null and
 * the visibility of the element is visible.
 *
 * @param {SomeElement} elem
 * @return {boolean}
 */
export function isElemVisible(elem) {
  if (elem == null) return false;
  const computedStyle = window.getComputedStyle(elem);
  if (computedStyle.display === 'none') return false;
  return computedStyle.visibility === 'visible';
}

/**
 * Returns the Nth parent element of the supplied element (indexing assumes start is 1)
 * @param {SomeElement} elem - The element to retrieve the nth parent element of
 * @param {number} nth - The number of the nth parent
 * @return {?SomeElement} - The nth parent element if it exists
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
 * Returns T/F indicating if the supplied element's textContents contains the supplied string
 * @param {SomeElement} elem
 * @param {string} needle - The string that the elements textContents should contain
 * @param {boolean} [caseInsensitive] - Should the compairison be case insensitive
 * @returns {boolean}
 */
export function elementTextContains(elem, needle, caseInsensitive) {
  if (elem != null && elem.textContent != null) {
    const tc = elem.textContent;
    return (caseInsensitive ? tc.toLowerCase() : tc).includes(needle);
  }
  return false;
}

/**
 * Returns T/F indicating if the supplied element's textContents equals the supplied string
 * @param {SomeElement} elem
 * @param {string} shouldEqual - The string that the elements textContents should be equal to
 * @param {boolean} [caseInsensitive] - Should the compairison be case insensitive
 * @returns {boolean}
 */
export function elementTextEqs(elem, shouldEqual, caseInsensitive) {
  if (elem != null) {
    const tc = elem.textContent;
    return (caseInsensitive ? tc.toLowerCase() : tc) == shouldEqual;
  }
  return false;
}

/**
 * Returns T/F indicating if the supplied element' textContent starts and ends with the supplied start and end strings
 * @param {SomeElement} elem
 * @param {string} start - The string the element's textContent should start with
 * @param {string} end - The string the element's textContent should end with
 * @returns {boolean}
 */
export function elementTextStartsWithAndEndsWith(elem, start, end) {
  return elementTextStartsWith(elem, start) && elementTextEndsWith(elem, end);
}

/**
 * Returns T/F indicating if the supplied element's textContent starts with the supplied string
 * @param {SomeElement} elem
 * @param {string} start - The string the element's textContent should start with
 * @returns {boolean}
 */
export function elementTextStartsWith(elem, start) {
  if (elem != null && elem.textContent != null) {
    return elem.textContent.startsWith(start);
  }
  return false;
}

/**
 * Returns T/F indicating if the supplied element's textContent ends with the supplied string
 * @param {SomeElement} elem
 * @param {string} end - The string the element's textContent should end with
 * @returns {boolean}
 */
export function elementTextEndsWith(elem, end) {
  if (elem != null && elem.textContent != null) {
    return elem.textContent.endsWith(end);
  }
  return false;
}

/**
 * Returns the results of splitting the supplied elements innerText using the supplied splitter
 * @param {SomeElement} elem
 * @param {string|RegExp} splitter
 * @returns {?Array<string>}
 */
export function splitElemInnerText(elem, splitter) {
  if (elem != null && elem.innerText != null) {
    return elem.innerText.split(splitter);
  }
  return null;
}

/**
 * Returns the results of splitting the supplied elements textContent using the supplied splitter
 * @param {SomeElement} elem
 * @param {string|RegExp} splitter
 * @returns {?Array<string>}
 */
export function splitElemTextContents(elem, splitter) {
  if (elem != null && elem.textContent != null) {
    return elem.textContent.split(splitter);
  }
  return null;
}

/**
 * Returns the supplied elements innerText
 * @param {?SomeElement} elem
 * @param {boolean} [trim] - Should the innerText be trimmed
 * @returns {?string}
 */
export function elemInnerText(elem, trim) {
  if (elem != null && elem.innerText != null) {
    return trim ? elem.innerText.trim() : elem.innerText;
  }
  return null;
}

/**
 * Returns T/F if the supplied elements innerText matches the supplied regex
 * @param {SomeElement} elem
 * @param {RegExp} regex
 * @return {boolean}
 */
export function elemInnerTextMatchesRegex(elem, regex) {
  if (elem == null) return false;
  return regex.test(elem.innerText);
}

/**
 * Returns the inner text of the element the supplied selectors matches
 * @param {string} selector - the selector to be use
 * @param {SomeElement|Document} [cntx] - element to use rather than document for the querySelector call
 * @return {?string}
 */
export function innerTextOfSelected(selector, cntx) {
  return elemInnerText(qs(selector, cntx));
}

/**
 * Returns T/F if the supplied elements innerText equals the supplied string case sensitive
 * @param {SomeElement} elem
 * @param {string} shouldEqual - The string the elements inner text should equal
 * @param {boolean} [trim = false] - Should the innerText be trimmed before comparison
 * @return {boolean}
 */
export function elemInnerTextEqs(elem, shouldEqual, trim = false) {
  if (elem == null || !elem.innerText) return false;
  const innerText = trim ? elem.innerText.trim() : elem.innerText;
  return innerText === shouldEqual;
}

/**
 * Returns T/F if the supplied elements innerText equals the supplied string case in-sensitive
 * @param {SomeElement} elem
 * @param {string} shouldEqual
 * @param {boolean} [trim = false]
 * @return {boolean}
 */
export function elemInnerTextEqsInsensitive(elem, shouldEqual, trim = false) {
  if (elem == null || !elem.innerText) return false;
  const innerText = trim ? elem.innerText.trim() : elem.innerText;
  return innerText.toLowerCase() === shouldEqual;
}

/**
 * Returns T/F if the supplied elements innerText equals one of the supplied string case sensitive
 * @param {SomeElement} elem
 * @param {...string} shouldEquals
 * @return {boolean}
 */
export function elemInnerTextEqsOneOf(elem, ...shouldEquals) {
  if (elem != null && elem.innerText != null) return false;
  const innertText = elem.innerText;
  for (var i = 0; i < shouldEquals.length; ++i) {
    if (innertText === shouldEquals[i]) return true;
  }
  return false;
}

/**
 * Returns the textContent of the supplied element
 * @param {SomeElement} elem
 * @returns {?string}
 */
export function elemTextContent(elem) {
  if (elem != null && elem.textContent != null) return elem.textContent;
  return null;
}

/**
 * Returns the scrollTop and scrollLeft values of the supplied document if one
 * was supplied other wise the values are from the current document
 * @param {?Document} [doc]
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
 * Helper function to get the actual x and y position,
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
 * Get the position of the passed DOM element
 * @param {SomeElement} element
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
 * Get the center of the passed DOM element
 * @param {SomeElement} element
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
 * Determines if the element the supplied selector selects exists.
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
 * Returns T/F indicating if the elements name (localName) is equal to the supplied name
 * @param {SomeElement} elem - The element to check if its name equals the supplied name
 * @param {string} name - The name of the desired element
 * @return {boolean}
 */
export function elementsNameEquals(elem, name) {
  if (!elem) return false;
  return elem.localName === name;
}

/**
 * Returns T/F indicating if the nodes name (nodeName) is equal to the supplied name
 * @param {SomeElement} node - The node to check if its name equals the supplied name
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
 * Returns the results of evaluating one of the supplied xpath queries if
 * one of the queries yields results otherwise null/undefined
 * @param {XPathOnOfOpts} options
 * @return {?Array<SomeElement>}
 */
export function xpathOneOf({ queries, xpg, context }) {
  let results = null;
  for (var i = 0; i < queries.length; i++) {
    results = xpg(queries[i], context);
    if (results.length || results.snapshotLength) return results;
  }
  return results;
}

/**
 * Returns the results of querySelector using one of the supplied selectors
 * one if one of the selectors yields results otherwise null/undefined
 * @param {{selectors: Array<string>, context: *}} options
 * @return {?SomeElement}
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
 * Returns the results of querySelectorAll using one of the supplied
 * selectors if one of the selectors yields results otherwise null/undefined
 * @param {{selectors: Array<string>, context: *}} options - Optional document object to use rather than
 * defaulting to the current execution contexts document object
 * @return {?NodeList<SomeElement>}
 */
export function qsaOneOf({ selectors, context }) {
  if (selectors == null) return null;
  let results = null;
  for (var i = 0; i < selectors.length; i++) {
    results = qsa(selectors[i], context);
    if (results.length) return results;
  }
  return results;
}

/**
 * Returns the next element sibling of the supplied selector IFF
 * the selector returns a results and the next element sibling exists
 * otherwise null/undefined
 * @param {string} selector - The selector for the element who's next sibling is
 * to be returned
 * @param {SomeElement|Document} [context] - element to use rather than document for the querySelector call
 * @return {?SomeElement}
 */
export function selectedNextElementSibling(selector, context) {
  const maybeSelected = qs(selector, context);
  if (maybeSelected && maybeSelected.nextElementSibling) {
    return maybeSelected.nextElementSibling;
  }
  return null;
}

/**
 * Returns the previous element sibling of the supplied selector IFF
 * the selector returns a results and the next element sibling exists
 * otherwise null/undefined
 * @param {string} selector - The selector for the element who's previous sibling is
 * to be returned
 * @param {SomeElement|Document} [context] - element to use rather than document for the querySelector call
 * @return {?SomeElement}
 */
export function selectedPreviousElementSibling(selector, context) {
  const maybeSelected = qs(selector, context);
  if (maybeSelected && maybeSelected.previousElementSibling) {
    return maybeSelected.previousElementSibling;
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
 * @param {string} query - The xpath query to be repeated until it returns no more elements
 * @param [cntx] - Optional element to execute the xpath query from (defaults to document)
 * @param {function(): void} [generateMoreElements] - Optional function used to generate more elements that may match the supplied xpath
 * @return {IterableIterator<SomeElement>}
 */
export function* repeatedXpathQueryIterator(query, cntx, generateMoreElements) {
  let snapShot = xpathSnapShot(query, cntx);
  const haveGenMore = typeof generateMoreElements === 'function';
  while (snapShot.snapshotLength > 0) {
    for (let i = 0; i < snapShot.snapshotLength; i++) {
      yield snapShot.snapshotItem(i);
    }
    snapShot = xpathSnapShot(query, cntx);
    if (snapShot.snapshotLength === 0) {
      if (haveGenMore) generateMoreElements();
      snapShot = xpathSnapShot(query, cntx);
    }
  }
}

/**
 * Repeatably performs the supplied xpath query yielding the results
 * of the each query. If an empty result set is encountered and generateMoreElements
 * function was supplied it is called and the query repeated. If the second query
 * try yields another empty set the iterator ends
 * @param {string} query - The xpath query to be repeated until it returns no more elements
 * @param [cntx] - Optional element to execute the xpath query from (defaults to document)
 * @param {function(): *} [generateMoreElements] - Optional function used to generate more elements that may match the supplied xpath
 * @return {AsyncIterableIterator<SomeElement>}
 */
export async function* repeatedXpathQueryIteratorAsync(
  query,
  cntx,
  generateMoreElements
) {
  let snapShot = xpathSnapShot(query, cntx);
  let i;
  const haveGenMore = typeof generateMoreElements === 'function';
  while (snapShot.snapshotLength > 0) {
    for (i = 0; i < snapShot.snapshotLength; i++) {
      yield snapShot.snapshotItem(i);
    }
    snapShot = xpathSnapShot(query, cntx);
    if (snapShot.snapshotLength === 0) {
      if (haveGenMore) {
        const result = generateMoreElements();
        if (isPromise(result)) await result;
      }
      snapShot = xpathSnapShot(query, cntx);
    }
  }
}

/**
 * Returns the value of the elements data attribute if it exists
 * If the element is null/undefined or does not have data attributes null is returned.
 * @param {HTMLElement|SVGElement} elem - The element that should have the data attribute
 * @param {string} dataKey - The name of the data value to be retrieved
 * @return {?string}
 */
export function elemDataValue(elem, dataKey) {
  if (!elem) return null;
  if (!elem.dataset) return null;
  return elem.dataset[dataKey];
}

/**
 * Returns T/F indicating if the element has data attribute equal to the supplied value
 * @param {HTMLElement|SVGElement} elem - The element that should have the data attribute
 * @param dataKey - The name of the data value to be retrieved
 * @param dataValue - The expected value of the elements data attribute
 * @return {boolean}
 */
export function elemDataValueEqs(elem, dataKey, dataValue) {
  if (!elem || !elem.dataset) return false;
  return elem.dataset[dataKey] === dataValue;
}

/**
 * Returns T/F indicating if the supplied element has children.
 * If the supplied element is null/undefined false is returned.
 * @param {Element?} elem - The element to be checked for children
 * @return {boolean}
 */
export function elemHasChildren(elem) {
  if (elem == null) return false;
  if (typeof elem.hasChildNodes === 'function') {
    return elem.hasChildNodes();
  }
  return elem.children.length > 0;
}

/**
 * Returns an iterator over the supplied parent element's child elements that
 * ends once the current child has no next element sibling.
 *
 * If the parent element is null/undefined then the returned iterator yields nothing.
 * @param {SomeElement?} parentElement - The parent element who's child elements will be iterated over
 * @return {IterableIterator<SomeElement?>}
 */
export function* childElementIterator(parentElement) {
  if (parentElement == null) return;
  let child = parentElement.firstElementChild;
  while (child != null) {
    yield child;
    child = child.nextElementSibling;
  }
}

/**
 * Returns an iterator over the child elements of the selected element
 * @param {string} selector - The selector to be used to select the parent element
 * @param {SomeElement} [cntx] - Optional element to use rather than document for the querySelector call
 * @return {IterableIterator<SomeElement>}
 */
export function childElementIteratorOfSelected(selector, cntx) {
  const parent = qs(selector, cntx);
  return childElementIterator(parent);
}

/**
 * Returns an iterator over the supplied parent element's child nodes that
 * ends once the current child has no next sibling.
 *
 * If the parent element is null/undefined then the returned iterator yields nothing.
 * @param {SomeElement?} parentElement - The parent element who's child nodes will be iterated over
 * @return {IterableIterator<Node?>}
 */
export function* childNodeIterator(parentElement) {
  if (parentElement == null) return;
  let child = parentElement.firstChild;
  while (child != null) {
    yield child;
    child = child.nextSibling;
  }
}

/**
 * Applies the supplied `predicate` to every child element of the supplied
 * parent element and returns the element that the `predicate` returns true for
 * otherwise returns null.
 *
 * If the parent element is null then null is returned.
 * @param {SomeElement} parentElement - The parent element who's child element will be searched
 * @param {function(elem: SomeElement): boolean} predicate - The predicate function used to select a child
 * @return {?SomeElement}
 */
export function findDirectChildElement(parentElement, predicate) {
  if (parentElement == null || !isFunction(predicate)) return null;
  for (let i = 0; i < parentElement.children.length; i++) {
    if (predicate(parentElement.children[i])) return parentElement.children[i];
  }
  return null;
}

/**
 * Returns a promise that resolves to true once the supplied event is fired from the supplied
 * event target. If `max` is supplied and the event is not fired by `max` the promise resolves to false.
 * @param {EventTarget} eventTarget - The event target that should fire `event`
 * @param {string} event - The event that should be fired from `eventTarget`
 * @param {number} [max] - Optional amount of time in milliseconds that defines
 * a maximum time to be waited for `event`
 * @return {Promise<boolean>}
 */
export function waitForEventTargetToFireEvent(eventTarget, event, max) {
  const promResolveReject = promiseResolveReject();
  const listener = fromSafety => {
    eventTarget.removeEventListener(event, listener);
    promResolveReject.resolve(!fromSafety);
  };
  eventTarget.addEventListener(event, listener);
  if (max) {
    setTimeout(listener, max, true);
  }
  return promResolveReject.promise;
}

/**
 * Loads the supplied URL in an invisible iframe, waits for the iframes load
 * event, and then removes the iframe
 * @param {string} pageURL
 * @return {Promise<void>}
 */
export async function loadPageViaIframe(pageURL) {
  const iframe = document.createElement('iframe');
  iframe.src = pageURL;
  iframe.setAttribute(
    'style',
    `width: 100vw; 
height: 100vh;
opacity: 0;
visibility: hidden;
`
  );
  const loadProm = waitForEventTargetToFireEvent(iframe, 'load');
  document.body.appendChild(iframe);
  await loadProm;
  iframe.remove();
}

/**
 * @typedef {HTMLAnchorElement|HTMLElement|HTMLAppletElement|HTMLAreaElement|HTMLAudioElement|HTMLBaseElement|HTMLBaseFontElement|HTMLQuoteElement|HTMLBodyElement|HTMLBRElement|HTMLButtonElement|HTMLCanvasElement|HTMLTableCaptionElement|HTMLTableColElement|HTMLDataElement|HTMLDataListElement|HTMLModElement|HTMLDetailsElement|HTMLDialogElement|HTMLDirectoryElement|HTMLDivElement|HTMLDListElement|HTMLEmbedElement|HTMLFieldSetElement|HTMLFontElement|HTMLFormElement|HTMLFrameElement|HTMLFrameSetElement|HTMLHeadingElement|HTMLHeadElement|HTMLHRElement|HTMLHtmlElement|HTMLIFrameElement|HTMLImageElement|HTMLInputElement|HTMLLabelElement|HTMLLegendElement|HTMLLIElement|HTMLLinkElement|HTMLMapElement|HTMLMarqueeElement|HTMLMenuElement|HTMLMetaElement|HTMLMeterElement|HTMLObjectElement|HTMLOListElement|HTMLOptGroupElement|HTMLOptionElement|HTMLOutputElement|HTMLParagraphElement|HTMLParamElement|HTMLPictureElement|HTMLPreElement|HTMLProgressElement|HTMLScriptElement|HTMLSelectElement|HTMLSlotElement|HTMLSourceElement|HTMLSpanElement|HTMLStyleElement|HTMLTableElement|HTMLTableSectionElement|HTMLTableDataCellElement|HTMLTemplateElement|HTMLTextAreaElement|HTMLTableHeaderCellElement|HTMLTimeElement|HTMLTitleElement|HTMLTableRowElement|HTMLTrackElement|HTMLUListElement|HTMLVideoElement|Element|Node|SVGAElement|SVGCircleElement|SVGClipPathElement|SVGDefsElement|SVGDescElement|SVGEllipseElement|SVGFEBlendElement|SVGFEColorMatrixElement|SVGFEComponentTransferElement|SVGFECompositeElement|SVGFEConvolveMatrixElement|SVGFEDiffuseLightingElement|SVGFEDisplacementMapElement|SVGFEDistantLightElement|SVGFEFloodElement|SVGFEFuncAElement|SVGFEFuncBElement|SVGFEFuncGElement|SVGFEFuncRElement|SVGFEGaussianBlurElement|SVGFEImageElement|SVGFEMergeElement|SVGFEMergeNodeElement|SVGFEMorphologyElement|SVGFEOffsetElement|SVGFEPointLightElement|SVGFESpecularLightingElement|SVGFESpotLightElement|SVGFETileElement|SVGFETurbulenceElement|SVGFilterElement|SVGForeignObjectElement|SVGGElement|SVGImageElement|SVGLineElement|SVGLinearGradientElement|SVGMarkerElement|SVGMaskElement|SVGMetadataElement|SVGPathElement|SVGPatternElement|SVGPolygonElement|SVGPolylineElement|SVGRadialGradientElement|SVGRectElement|SVGScriptElement|SVGStopElement|SVGStyleElement|SVGSVGElement|SVGSwitchElement|SVGSymbolElement|SVGTextElement|SVGTextPathElement|SVGTitleElement|SVGTSpanElement|SVGUseElement|SVGViewElement} SomeElement
 */
