export default class Delays {
  /**
   * @param {number} [delayTime = 3000]
   * @returns {Promise<void>}
   */
  static delay(delayTime = 3000) {
    return new Promise(resolve => {
      setTimeout(resolve, delayTime);
    });
  }

  /**
   * @param {function(): boolean} predicate
   * @returns {Promise<void>}
   */
  static waitForPredicate(predicate) {
    return new Promise(resolve => {
      const cb = () => {
        if (predicate()) {
          resolve();
        } else {
          window.requestAnimationFrame(cb);
        }
      };
      window.requestAnimationFrame(cb);
    });
  }

  /**
   * @param {string} selector
   * @param {Element | Node | HTMLElement} [fromNode]
   * @return {Promise<Element | Node | HTMLElement>}
   */
  static async waitForAndSelectElement(selector, fromNode) {
    let elem = fromNode.querySelector(selector);
    if (!elem) {
      await Delays.waitForPredicate(() => fromNode.querySelector(selector) != null);
      elem = fromNode.querySelector(selector);
    }
    return elem;
  }
}
