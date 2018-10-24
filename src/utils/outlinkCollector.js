
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
    this.collectFrom(document);
  }

  collectFrom(queryFrom) {
    const found = queryFrom.querySelectorAll(this.outlinkSelector);
    let elem;
    let i = found.length;
    while (i--) {
      elem = found[i];
      let href = elem.href.trim();
      if (href.length > 0 && href !== ' ') {
        if (!this.shouldIgnore(href) && !this.outlinks.has(href)) {
          this.outlinks.add(href);
        }
      }
    }
  }

  /**
   * @param {HTMLAnchorElement|HTMLAreaElement} elem
   */
  addOutlink(elem) {
    if (!this.shouldIgnore(elem.href) && !this.outlinks.has(elem.href)) {
      this.outlinks.add(elem.href)
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
  toJSON () {
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
  enumerable: false,
});

export default OLC;
