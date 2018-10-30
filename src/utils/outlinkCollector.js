const outlinks = new Set();
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

export function addOutLinks(outlinks) {
  let href;
  let i = outlinks.length;
  while (i--) {
    href = outlinks[i].href.trim();
    if (href && !outlinks.has(href) && !shouldIgnoreLink(href)) {
      outlinks.add(href);
    }
  }
}

export function collectOutlinksFromDoc() {
  addOutLinks(document.querySelectorAll(outlinkSelector));
}

export function collectOutlinksFrom(queryFrom) {
  addOutLinks(queryFrom.querySelectorAll(outlinkSelector));
}

/**
 * @param {HTMLAnchorElement|HTMLAreaElement|string} elemOrString
 */
export function addOutlink(elemOrString) {
  const href = (elemOrString.href || elemOrString).trim();
  if (href && !outlinks.has(href) && !shouldIgnoreLink(href)) {
    outlinks.add(href);
  }
}


Object.defineProperty(window, '$wbOutlinks$', {
  get() {
    return Array.from(outlinks);
  },
  set() {},
  enumerable: false
});
