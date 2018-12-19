import { autobind } from '../utils/general';

export class BehaviorRunner {
  /**
   * @param {AsyncIterator<*>} behaviorStepIterator
   * @param {function(results: Object): Object} [postStepFN]
   */
  constructor(behaviorStepIterator, postStepFN) {
    /**
     * @type {AsyncIterator<*>}
     */
    this.stepIterator = behaviorStepIterator;

    /**
     * @type {?number}
     */
    this.upCheckInterval = null;
    this.postStepFN = postStepFN;
    autobind(this);
  }

  swapBehaviorIterator(newBehaviorIterator) {
    this.stepIterator = newBehaviorIterator;
  }

  /**
   * @return {Promise<any>}
   */
  waitToBeUnpaused() {
    return new Promise(resolve => {
      this.upCheckInterval = setInterval(() => {
        if (!window.$WBBehaviorPaused) {
          clearInterval(this.upCheckInterval);
          this.upCheckInterval = null;
          resolve();
        }
      }, 2000);
    });
  }

  /**
   * @return {Promise<any>}
   */
  async performStep() {
    const result = await this.stepIterator.next();
    if (this.postStepFN) {
      return this.postStepFN(result);
    }
    return result.done;
  }

  /**
   * @return {Promise<any>}
   */
  step() {
    if (window.$WBBehaviorPaused) {
      return this.waitToBeUnpaused().then(this.performStep);
    }
    return this.performStep();
  }
}

/**
 * @param {AsyncIterator<*>} behaviorStepIterator
 * @param {function(results: Object): Object} [postStepFN]
 * @return {Proxy<BehaviorRunner>}
 */
export default function runBehavior(behaviorStepIterator, postStepFN) {
  const runner = new BehaviorRunner(behaviorStepIterator, postStepFN);
  return new Proxy(runner, {
    apply(target, thisArg, argArray) {
      return target.step();
    }
  });
}
