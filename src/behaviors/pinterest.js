(function pinterest(xpg, debug = false) {
  if (debug && document.getElementById('$wrStyle$') == null) {
    const style = document.createElement('style');
    style.id = '$wrStyle$';
    style.innerText = '.wr-debug-visited {border: 6px solid #3232F1;} ';
    document.head.appendChild(style);
  }

  if (
    typeof xpg !== 'function' ||
    xpg.toString().indexOf('[Command Line API]') === -1
  ) {
    /**
     * @desc Polyfill console api $x
     * @param {string} xpathQuery
     * @param {Element | Document} startElem
     * @return {Array<HTMLElement>}
     */
    xpg = function (xpathQuery, startElem) {
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

  const reactProps = {
    rootContainer: '_reactRootContainer',
    internalRoot: '_internalRoot',
    onDomNode: '__reactInternalInstance',
    mProps: 'memoizedProps'
  };

  function QS(selector, elem) {
    if (elem == null) return document.querySelector(selector);
    return elem.querySelector(selector);
  }

  function QSA(selector, elem) {
    if (elem == null) return document.querySelectorAll(selector);
    return elem.querySelectorAll(selector);
  }

  /**
   * @param {Element | Node} elem
   * @return {Object}
   */
  function reactInstanceFromDOMElem(elem) {
    const keys = Object.keys(elem);
    let i = 0;
    let len = keys.length;
    let internalKey;
    while (i < len) {
      if (keys[i].startsWith(reactProps.onDomNode)) {
        internalKey = keys[i];
        break;
      }
      i += 1;
    }
    if (!internalKey) throw new Error('Could not find react internal key');
    return elem[internalKey];
  }

  class PintrestPosts {
    constructor(xpg) {
      this.xpg = xpg;
      this.selectors = {
        gridImage: 'div[data-grid-item]',
        gridContainer: 'div.gridCentered > div > div > div'
      };
      /**
       * @type {Set<string>}
       */
      this.seenPins = new Set();
      this.pinContainer = null;
      this.pinContainerR = null;
      this._didInit = false;

      this.scrollBehavior = {
        behavior: 'auto',
        block: 'center',
        inline: 'center'
      };
    }

    init() {
      if (this._didInit) return;
      this.pinContainer = this.getGridContainer();
      this.pinContainerR = reactInstanceFromDOMElem(this.pinContainer);
      this._didInit = true;
    }

    async *pinIterator() {
      let currentPostRows = this.getRenderedPins();
      // consume rows until all posts have been loaded
      do {
        yield* this.consumePins(currentPostRows);
        currentPostRows = this.getRenderedPins();
      } while (currentPostRows.length > 0);
      // finish consuming the rows until we are done
      if (currentPostRows.length === 0) {
        currentPostRows = this.getRenderedPins();
      }
      do {
        yield* this.consumePins(currentPostRows);
        currentPostRows = this.getRenderedPins();
      } while (currentPostRows.length > 0);
    }

    scrollIntoView(elem, delayTime = 1000) {
      elem.scrollIntoView(this.scrollBehavior);
      return this.delay(delayTime);
    }

    delay(delayTime = 3000) {
      return new Promise(r => setTimeout(r, delayTime));
    }

    async *consumePins(renderedPins) {
      let pin,
        i = 0,
        numPins = renderedPins.length;
      for (; i < numPins; ++i) {
        // scroll post row into view
        pin = renderedPins[i];
        await this.scrollIntoView(pin.node);
        // pin.node.classList.add('wr-debug-visited');
        yield pin.node;
      }
    }

    getGridContainer() {
      const firstChild = QS(this.selectors.gridImage);
      const container = firstChild.parentElement;
      if (container !== QS(this.selectors.gridContainer)) {
        throw new Error('wrong container');
      }
      return container;
    }

    getRenderedPins() {
      const nodes = this.pinContainerR.stateNode.childNodes;
      const renderedNodes = [];
      const length = nodes.length;
      let i = 0;
      let node;
      let reactInstance;
      for (; i < length; ++i) {
        node = nodes[i];
        reactInstance = reactInstanceFromDOMElem(node);
        if (!this.seenPins.has(reactInstance.key)) {
          this.seenPins.add(reactInstance.key);
          renderedNodes.push({ node, reactInstance });
        }
      }
      return renderedNodes;
    }

    [Symbol.asyncIterator]() {
      return this.pinIterator();
    }
  }
  const pp = new PintrestPosts(xpg);
  pp.init();
  window.$WRIterator$ = pp[Symbol.asyncIterator]();
  window.$WRIteratorHandler$ = async function() {
    const next = await $WRIterator$.next();
    return next.done;
  };
})($x);
