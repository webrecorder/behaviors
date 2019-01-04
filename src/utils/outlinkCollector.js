if (typeof window.$wbOutlinkSet$ === 'undefined') {
  Object.defineProperty(window, '$wbOutlinkSet$', {
    value: new Set(),
    enumerable: false
  });
} else {
  window.$wbOutlinkSet$.clear();
}

if (typeof window.$wbOutlinks$ === 'undefined') {
  Object.defineProperty(window, '$wbOutlinks$', {
    get() {
      return Array.from(window.$wbOutlinkSet$);
    },
    set () {},
    enumerable: false
  });
}

const outlinks = window.$wbOutlinkSet$;

const ignoredSchemes = [
  'about:',
  'data:',
  'mailto:',
  'javascript:',
  'js:',
  '{',
  '*',
  'ftp:',
  'tel:'
];
const goodSchemes = { 'http:': true, 'https:': true };
const outLinkURLParser = new URL('about:blank');
const outlinkSelector = 'a[href], area[href]';

function shouldIgnoreLink(test) {
  let ignored = false;
  let i = ignored.length;
  while (i--) {
    if (test.startsWith(ignored[i])) {
      ignored = true;
      break;
    }
  }
  if (!ignored) {
    let parsed = true;
    try {
      outLinkURLParser.href = test;
    } catch (error) {
      parsed = false;
    }
    return !(parsed && goodSchemes[outLinkURLParser.protocol]);
  }
  return ignored;
}

export function addOutLinks(toAdd) {
  let href;
  let i = toAdd.length;
  while (i--) {
    href = toAdd[i].href.trim();
    if (href && !outlinks.has(href) && !shouldIgnoreLink(href)) {
      outlinks.add(href);
    }
  }
}

export function collectOutlinksFromDoc() {
  if (window.$WBNOOUTLINKS) {
    return
  }
  addOutLinks(document.querySelectorAll(outlinkSelector));
}

export function collectOutlinksFrom(queryFrom) {
  if (window.$WBNOOUTLINKS) {
    return
  }
  addOutLinks(queryFrom.querySelectorAll(outlinkSelector));
}

/**
 * @param {HTMLAnchorElement|HTMLAreaElement|string} elemOrString
 */
export function addOutlink(elemOrString) {
  if (window.$WBNOOUTLINKS) {
    return
  }
  const href = (elemOrString.href || elemOrString).trim();
  if (href && !outlinks.has(href) && !shouldIgnoreLink(href)) {
    outlinks.add(href);
  }
}
