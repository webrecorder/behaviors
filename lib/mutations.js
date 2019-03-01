/**
 * @desc Observe dom mutation using a MutationObserver as a stream (AsyncIterator)
 */
export class MutationStream {
  constructor() {
    /**
     * @type {MutationObserver}
     */
    this.mo = new MutationObserver((ml, ob) => {
      if (this._resolve) {
        this._resolve(ml);
      }
    });

    /**
     * @type {?function(arg:*)}
     * @private
     */
    this._resolve = null;

    /**
     * @type {boolean}
     * @private
     */
    this._loopStream = false;
  }

  /**
   * @desc Start observing an element for mutations
   * @param {Node} elem - The element to be observed for mutations
   * @param {Object} config - Configuration object accepted by mutation observers
   */
  observe(elem, config) {
    this.mo.observe(elem, config);
    this._loopStream = true;
  }

  /**
   * @desc Start observing an element for mutations and receive an async iterator
   * yielding the observed mutations
   * @param {Node} elem - The element to be observed for mutations
   * @param {Object} config - Configuration object accepted by mutation observers
   * @return {AsyncIterator<MutationRecord[]>}
   */
  observeStream(elem, config) {
    this.observe(elem, config);
    return this.streamItr();
  }

  /**
   * @desc Creates a conditional mutation stream. If the startPredicate
   * does not return true then the the observer discontents ending the stream.
   * Otherwise the stream continues to emit mutations until the observer is
   * disconnected or the stopPredicate returns true. The stopPredicate is polled
   * at 1.5 second intervals when the observer is waiting for the next mutation.
   * @param {Node} elem - The element to be observed for mutations
   * @param {Object} config - Configuration object accepted by mutation observers
   * @param {function(): boolean} startPredicate - Predicate function right before
   * mutations are yielded to determine if the stream should end immediately or not
   * @param {function(): boolean} stopPredicate - Predicate function polled
   * while waiting for mutations to occur that returns false to indicate
   * the stream should end.
   * @return {AsyncIterator<MutationRecord[]>}
   */
  predicatedStream(elem, config, startPredicate, stopPredicate) {
    this.observe(elem, config);
    return this.predicateStreamItr(startPredicate, stopPredicate);
  }

  /**
   * @desc Disconnects the mutation observer and ends the stream
   */
  disconnect() {
    this.mo.disconnect();
    this._loopStream = false;
    if (this._resolve) {
      this._resolve(null);
    }
    this._resolve = null;
  }

  /**
   * @desc Returns a promise that resolves with the next observed mutation
   * @return {Promise<?MutationRecord[]>}
   * @private
   */
  _getNext() {
    return new Promise(resolve => {
      this._resolve = resolve;
    });
  }

  /**
   * @desc Returns an stream (async iterator) that yields
   * the observed mutations. Must have called {@link observe} before
   * calling this method, otherwise no mutations will be yielded
   * @return {AsyncIterator<MutationRecord[]>}
   */
  async *streamItr() {
    let next;
    while (this._loopStream) {
      next = await this._getNext();
      if (next == null) {
        break;
      }
      yield next;
    }
    this.disconnect();
  }

  /**
   * @desc Returns an mutation stream that ends if the startPredicate returns false
   * otherwise keeps the stream alive until disconnect or the stopPredicate, polled
   * at 1.5 second intervals when waiting for next mutation, returns false.
   * Automatically disconnects at the end.
   * @param {function(): boolean} startPredicate - Predicate function right before
   * mutations are yielded to determine if the stream should end immediately or not
   * @param {function(): boolean} stopPredicate - Predicate function polled
   * while waiting for mutations to occur that returns false to indicate
   * the stream should end.
   * @return {AsyncIterator<?MutationRecord[]>}
   */
  async *predicateStreamItr(startPredicate, stopPredicate) {
    if (!startPredicate()) {
      return this.disconnect();
    }
    let checkTo;
    let next;
    while (this._loopStream) {
      next = await Promise.race([
        this._getNext(),
        new Promise(resolve => {
          checkTo = setInterval(() => {
            if (stopPredicate()) {
              checkTo = null;
              clearInterval(checkTo);
              return resolve(null);
            }
          }, 1500);
        })
      ]);
      if (checkTo) {
        clearInterval(checkTo);
        checkTo = null;
      }
      if (next == null) break;
      yield next;
    }
    this.disconnect();
  }

  /**
   * @return {AsyncIterator<?MutationRecord[]>}
   */
  [Symbol.asyncIterator]() {
    return this.streamItr();
  }
}
