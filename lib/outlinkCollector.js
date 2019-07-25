let __outlinksSet__;
const ignoredSchemes = [
  'about:',
  'data:',
  'mailto:',
  'javascript:',
  'js:',
  '{',
  '*',
  'ftp:',
  'tel:',
];
const goodSchemes = { 'http:': true, 'https:': true };
const outlinkSelector = 'a[href], area[href]';
let outLinkURLParser;
let didInit = false;

function initOutlinkCollection() {
  didInit = true;
  outLinkURLParser = new URL('about:blank');
  if (window.$wbOutlinkSet$ == null) {
    __outlinksSet__ = new Set();
    Object.defineProperty(window, '$wbOutlinkSet$', {
      value: __outlinksSet__,
      enumerable: false,
    });
  } else {
    window.$wbOutlinkSet$.clear();
    __outlinksSet__ = window.$wbOutlinkSet$;
  }

  if (typeof window.$wbOutlinks$ === 'undefined') {
    Object.defineProperty(window, '$wbOutlinks$', {
      get() {
        const outlinks = Array.from(__outlinksSet__);
        __outlinksSet__.clear();
        return outlinks;
      },
      set() {},
      enumerable: false,
    });
  }
}

function shouldIgnoreLink(test) {
  for (let i = 0; i < ignoredSchemes.length; ++i) {
    if (test.startsWith(ignoredSchemes[i])) {
      return true;
    }
  }
  let parsed = true;
  try {
    outLinkURLParser.href = test;
  } catch (error) {
    parsed = false;
  }
  return !(parsed && goodSchemes[outLinkURLParser.protocol]);
}

/**
 * @desc Add the array/nodelist of A or Anchor tags href properties the collected outlinks
 * @param {Array<HTMLAnchorElement|HTMLAnchorElement>|NodeList} toAdd - The elements with
 * href properties that are to be added to the collected outlinks
 */
export function addOutLinks(toAdd) {
  if (window.$WBNOOUTLINKS) {
    return;
  }
  if (!didInit) initOutlinkCollection();
  let href;
  for (var i = 0; i < toAdd.length; i++) {
    href = toAdd[i].href.trim();
    if (href && !__outlinksSet__.has(href) && !shouldIgnoreLink(href)) {
      __outlinksSet__.add(href);
    }
  }
}

/**
 * @desc Collects the outlinks from the document
 */
export function collectOutlinksFromDoc() {
  if (window.$WBNOOUTLINKS) {
    return;
  }
  if (!didInit) initOutlinkCollection();
  addOutLinks(document.querySelectorAll(outlinkSelector));
}

/**
 * @desc Collects outlinks form the supplied element
 * @param {Element|Document} queryFrom - The element to collect outlinks
 * from
 */
export function collectOutlinksFrom(queryFrom) {
  if (window.$WBNOOUTLINKS) {
    return;
  }
  if (!didInit) initOutlinkCollection();
  addOutLinks(queryFrom.querySelectorAll(outlinkSelector));
}

/**
 * @desc Add the URL or href value of the supplied argument
 * @param {HTMLAnchorElement|HTMLAreaElement|string} elemOrString - The
 * element with href property or string to add to the collected outlinks
 */
export function addOutlink(elemOrString) {
  if (window.$WBNOOUTLINKS) {
    return;
  }
  if (!didInit) initOutlinkCollection();
  const href = (elemOrString.href || elemOrString).trim();
  if (href && !__outlinksSet__.has(href) && !shouldIgnoreLink(href)) {
    __outlinksSet__.add(href);
  }
}
