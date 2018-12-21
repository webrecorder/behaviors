import { autobind } from '../utils/general';
import { isDone } from './postStepFNs';

/**
 * @desc A thin wrapper around the execution of a behaviors actions
 * in order to support behavior pausing.
 *
 * A behavior is in a paused state when the property `$WBBehaviorPaused`,
 * found on the `window` object, is truthy and when that property is
 * falsy the behavior is considered in an un-paused state.
 *
 * The check for a behavior pause state transitions is done
 * before performing the behaviors next action, allowing the
 * action to be atomic.
 */
export class BehaviorRunner {
  /**
   * @param {AsyncIterator<*>} behaviorStepIterator - An async iterator that
   * yields the state of the behavior.
   * @param {function(results: {value: Any, done: boolean}): any} [postStepFN] - An optional
   * function that is supplied the state of the behavior after performing an action.
   * It is required that this function returns the state unmodified or a transformation
   * of the state that is either an object that contains the original value of the done property
   * or a boolean that is the value of the original done property.
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

    /**
     * @type {function(Object): any}
     */
    this.postStepFN = postStepFN != null ? postStepFN : isDone;

    /**
     * @type {?Promise<any>}
     * @private
     */
    this._waitP = null;
    autobind(this);
  }

  /**
   * @desc Swaps the behavior actions to be applied to the page.
   * @param {AsyncIterator<*>} newBehaviorIterator - a new behavior action iterator to be run
   * @param {function(results: {value: Any, done: boolean}): Object} [newPostStepFN] - an optional new post step function
   * to be used. If a previous postStepFN is in use and a new function is not supplied the old one is persisted.
   */
  swapBehaviorIterator(newBehaviorIterator, newPostStepFN) {
    this.stepIterator = newBehaviorIterator;
    if (newPostStepFN) {
      this.postStepFN = newPostStepFN;
    }
  }

  /**
   * @desc Swaps the postStepFN to be used.
   * @param {function(results: {value: Any, done: boolean}): Object} newPostStepFN - The new
   * postStepFN to be used.
   */
  swapPostStepFn(newPostStepFN) {
    this.postStepFN = newPostStepFN;
  }

  /**
   * @desc Returns a promise that resolves once `window.$WBBehaviorPaused`
   * is falsy, checking at 2 second intervals.
   * @return {Promise<any>}
   */
  waitToBeUnpaused() {
    this._waitP = new Promise(resolve => {
      this.upCheckInterval = setInterval(() => {
        if (!window.$WBBehaviorPaused) {
          clearInterval(this.upCheckInterval);
          resolve(this.performStep());
          this._waitP = null;
        }
      }, 2000);
    });
    return this._waitP;
  }

  /**
   * @desc Initiates the next behavior action.
   *
   * If a postStepFN was supplied it is called with the results of
   * the performed action otherwise they are returned directly.
   * @return {Promise<any>}
   */
  performStep() {
    const resultP = this.stepIterator.next();
    if (this.postStepFN) {
      return resultP.then(this.postStepFN);
    }
    return resultP;
  }

  /**
   * @desc Initiates the next action of a behavior.
   *
   * If the behavior is transitioning into the paused state (previously not paused)
   * the promise returned resolves with the results of performing the next
   * action once the un-paused state has been reached.
   *
   * If this method is called and the behavior is currently in the paused state
   * the promise returned is the same one returned when transitioning into the
   * paused state.
   *
   * Otherwise the returned promise resolves with the state of the behavior
   * after performing an action.
   * @return {Promise<any>}
   */
  step() {
    if (this._waitP) {
      return this._waitP;
    }
    if (window.$WBBehaviorPaused) {
      return this.waitToBeUnpaused();
    }
    return this.performStep();
  }

  /**
   * @desc Shortcut for running a behavior from a for await of loop.
   * @return {{next: (function(): Promise<any>)}}
   */
  [Symbol.asyncIterator]() {
    return {
      next: () => this.step()
    };
  }
}

/**
 * @param {Window} window - The window object
 * @param {AsyncIterator<*>} behaviorStepIterator
 * @param {function(results: Object): any} [postStepFN]
 * @return {Proxy<BehaviorRunner>}
 */
export default function runBehavior(window, behaviorStepIterator, postStepFN) {
  window.$WBBehaviorStepIter$ = behaviorStepIterator;
  const runner = new BehaviorRunner(behaviorStepIterator, postStepFN);
  // in order to allow usage of the behavior runner instance as a
  // callable (perform step) and access to its property we must proxy
  // a plane function using the apply, get, and set trap handlers
  window.$WRIteratorHandler$ = new Proxy(function() {}, {
    apply() {
      return runner.step();
    },
    get(target, p) {
      return Reflect.get(runner, p);
    },
    set(target, p, value) {
      return Reflect.set(runner, p, value);
    }
  });
  return window.$WRIteratorHandler$;
}
