class OutLinkCollector {
  constructor() {
    /**
     * @type {Set<string>}
     */
    this.outlinks = new Set();
    this.ignored = [
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
    this.good = { 'http:': true, 'https:': true };
    this.urlParer = new URL('about:blank');
    this.outlinkSelector = 'a[href], area[href]';
  }

  shouldIgnore(test) {
    let ignored = false;
    let i = this.ignored.length;
    while (i--) {
      if (test.startsWith(this.ignored[i])) {
        ignored = true;
        break;
      }
    }
    if (!ignored) {
      let parsed = true;
      try {
        this.urlParer.href = test;
      } catch (error) {
        parsed = false;
      }
      return !(parsed && this.good[this.urlParer.protocol]);
    }
    return ignored;
  }

  collectFromDoc() {
    this.addOutLinks(document.querySelectorAll(this.outlinkSelector));
  }

  collectFrom(queryFrom) {
    this.addOutLinks(queryFrom.querySelectorAll(this.outlinkSelector));
  }

  addOutLinks(outlinks) {
    let href;
    let i = outlinks.length;
    while (i--) {
      href = outlinks[i].href.trim();
      if (href && !this.outlinks.has(href) && !this.shouldIgnore(href)) {
        this.outlinks.add(href);
      }
    }
  }

  /**
   * @param {HTMLAnchorElement|HTMLAreaElement|string} elemOrString
   */
  addOutlink(elemOrString) {
    const href = (elemOrString.href || elemOrString).trim();
    if (href && !this.outlinks.has(href) && !this.shouldIgnore(href)) {
      this.outlinks.add(href);
    }
  }

  /**
   * @return {string[]}
   */
  outLinkArray() {
    return Array.from(this.outlinks);
  }

  /**
   * @return {string[]}
   */
  toJSON() {
    return this.outLinkArray();
  }

  /**
   * @return {string[]}
   */
  valueOf() {
    return this.outLinkArray();
  }
}

const OLC = new OutLinkCollector();

Object.defineProperty(window, '$wbOutlinks$', {
  value: OLC,
  writable: false,
  enumerable: false
});

export default OLC;
