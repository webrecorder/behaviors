/**
 * @desc Observe dom mutation using a MutationObserver as a stream (AsyncIterator)
 */
export class MutationStream {
  constructor() {
    this.mo = new MutationObserver((ml, ob) => {
      if (this._resolve) {
        this._resolve(ml);
      }
    });
    this._resolve = null;
    this._loopStream = false;
  }

  /**
   * @param {Node} elem
   * @param {Object} config
   */
  observe(elem, config) {
    this.mo.observe(elem, config);
    this._loopStream = true;
  }

  /**
   * @param {Node} elem
   * @param {Object} config
   * @return {AsyncIterableIterator<MutationRecord[]>}
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
   * @param {Node} elem
   * @param {Object} config
   * @param {function(): boolean} startPredicate
   * @param {function(): boolean} stopPredicate
   * @return {AsyncIterableIterator<MutationRecord[]>}
   */
  predicatedStream(elem, config, startPredicate, stopPredicate) {
    this.observe(elem, config);
    return this.predicateStreamItr(startPredicate, stopPredicate);
  }

  disconnect() {
    this.mo.disconnect();
    this._loopStream = false;
    if (this._resolve) {
      this._resolve(null);
    }
    this._resolve = null;
  }

  /**
   * @return {Promise<?MutationRecord[]>}
   * @private
   */
  _getNext() {
    return new Promise(resolve => {
      this._resolve = resolve;
    });
  }

  /**
   * @return {AsyncIterableIterator<MutationRecord[]>}
   */
  async *streamItr() {
    while (this._loopStream) {
      let next = await this._getNext();
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
   * @param {function(): boolean} startPredicate
   * @param {function(): boolean} stopPredicate
   * @return {AsyncIterableIterator<?MutationRecord[]>}
   */
  async *predicateStreamItr(startPredicate, stopPredicate) {
    if (!startPredicate()) {
      return this.disconnect();
    }
    while (this._loopStream) {
      let checkTo;
      let next = await Promise.race([
        this._getNext(),
        new Promise(resolve => {
          checkTo = setInterval(() => {
            if (stopPredicate()) {
              clearInterval(checkTo);
              return resolve(null);
            }
          }, 1500);
        })
      ]);
      if (checkTo) clearInterval(checkTo);
      if (next == null) {
        break;
      }
      yield next;
    }
    this.disconnect();
  }

  /**
   * @return {AsyncIterableIterator<?MutationRecord[]>}
   */
  [Symbol.asyncIterator]() {
    return this.streamItr();
  }
}
