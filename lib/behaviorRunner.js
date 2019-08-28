import { autobind } from './general';
import { doneOrWait } from './postStepFNs';
import { createMouseEvent } from './events';
import { delay } from './delays';

/**
 * A thin wrapper around the execution of a behaviors actions
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
   * @param {BehaviorRunnerOpts} init
   */
  constructor({ behaviorStepIterator, postStepFN, metadata }) {
    /**
     *  The behavior's action iterator
     * @type {RawBehaviorIterator}
     */
    this.stepIterator = behaviorStepIterator;

    /**
     * @type {?number}
     */
    this.upCheckInterval = null;

    /**
     * @type {?Object}
     */
    this.metadata = metadata;

    /**
     * A function used to transform the return value of {@link BehaviorRunner#stepIterator}
     * after performing an action into a value that is interpretable by Webrecorders automation
     * system.
     * @type {?function(result: RawBehaviorStepResults): BehaviorStepResults}
     */
    this.postStepFN = postStepFN;

    /**
     * @type {?Promise<void>}
     * @private
     */
    this._waitP = null;
    autobind(this);
  }

  /**
   * Returns T/F indicating if the behavior is currently paused
   * @return {boolean}
   */
  get isPaused() {
    return window.$WBBehaviorPaused;
  }

  /**
   * Swaps the behavior actions to be applied to the page.
   * @param {RawBehaviorIterator} newBehaviorIterator - a new behavior action iterator to be run
   * @param {function(results: RawBehaviorStepResults): BehaviorStepResults} [newPostStepFN] - an optional new post step function
   * to be used. If a previous postStepFN is in use and a new function is not supplied the old one is persisted.
   */
  swapBehaviorIterator(newBehaviorIterator, newPostStepFN) {
    this.stepIterator = newBehaviorIterator;
    if (newPostStepFN) {
      this.postStepFN = newPostStepFN;
    }
  }

  /**
   * Swaps the postStepFN to be used.
   * @param {function(results: RawBehaviorStepResults): BehaviorStepResults} newPostStepFN - The new
   * postStepFN to be used.
   */
  swapPostStepFn(newPostStepFN) {
    this.postStepFN = newPostStepFN;
  }

  /**
   * Returns a promise that resolves once `window.$WBBehaviorPaused`
   * is falsy, checking at 2 second intervals.
   * @return {Promise<void>}
   */
  waitToBeUnpaused() {
    if (this._waitP) return this._waitP;
    this._waitP = new Promise(resolve => {
      this.upCheckInterval = setInterval(() => {
        if (!window.$WBBehaviorPaused) {
          clearInterval(this.upCheckInterval);
          this._waitP = null;
          resolve();
        }
      }, 2000);
    });
    return this._waitP;
  }

  /**
   * Calls the next function of {@link BehaviorRunner#stepIterator} and
   * if a postStepFN was supplied it is called with the results of
   * the performed action otherwise they are returned directly.
   * @return {Promise<BehaviorStepResults>}
   */
  performStep() {
    const resultP = this.stepIterator.next();
    if (this.postStepFN) {
      return resultP.then(this.postStepFN);
    }
    return resultP.then(doneOrWait);
  }

  /**
   * Initiates the next action of a behavior.
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
   * @return {Promise<BehaviorStepResults>}
   */
  step() {
    if (this._waitP) {
      return this._waitP;
    }
    if (window.$WBBehaviorPaused) {
      return this.waitToBeUnpaused().then(this.performStep);
    }
    return this.performStep();
  }

  /**
   * Shortcut for automatically run the behavior via async generators with
   * the ability to optionally supply
   *
   * @example
   *   // in some async function
   *   for await (const value of runner.autoRunIter()) {
   *     console.log(value)
   *   }
   * @param {BehaviorRunOptions} [options] - Options for controlling
   * the amount of delay applied after each step if any and outlink collection.
   * @return {AsyncIterableIterator<BehaviorStepResults>}
   */
  async *autoRunIter(options) {
    const opts = Object.assign({ noOutlinks: true }, options);
    const haveDelay = typeof opts.delayAmount === 'number';
    window.$WBNOOUTLINKS = opts.noOutlinks;
    let next;
    while (true) {
      next = await this.step();
      // if we are not collecting outlinks no need to add that property
      yield opts.noOutlinks
        ? next
        : Object.assign({ outlinks: window.$wbOutlinks$ }, next);
      if (next.done) break;
      if (haveDelay) await delay(opts.delayAmount);
    }
  }

  /**
   * Automatically run the behavior to completion optionally supplying
   * options for controlling logging, delay, and outlink collection.
   *
   * Default options are no logging, no delay, and no collection of outlinks.
   * @param {BehaviorRunOptions} [options] - Options for controlling
   * the amount of delay applied after each step if any and outlink collection.
   * @return {Promise<void>}
   */
  async autoRun(options) {
    const opts = Object.assign({ logging: false }, options);
    for await (const step of this.autoRunIter(opts)) {
      if (opts.logging) {
        console.log(step.msg, step.state);
      }
    }
    if (opts.logging) {
      console.log('done');
    }
  }

  /**
   * Pauses the behavior by setting the behavior paused flag to true
   */
  pause() {
    window.$WBBehaviorPaused = true;
  }

  /**
   * Un-pauses the behavior by setting the behavior paused flag to false
   */
  unpause() {
    window.$WBBehaviorPaused = false;
  }

  /**
   * Shortcut for running a behavior from a for await of loop.
   * @return {BehaviorRunnerAsyncIterator}
   */
  [Symbol.asyncIterator]() {
    return {
      next: () => this.step(),
    };
  }
}

/**
 * Performs the setup required for integration with Webrecorders automation system
 * Adds as propeties to the supplied window object
 *  - $WBBehaviorStepIter$: the supplied `behaviorStepIterator`
 *  - $WBBehaviorRunner$: the instance of the class that wraps the behaviors actions
 *  - $WRIteratorHandler$: a function that initiates a behaviors action
 * @param {BehaviorRunnerInitOpts} init - Object used to initialize the behavior for running
 * @return {BehaviorRunner}
 */
export function initRunnableBehavior({
  win,
  behaviorStepIterator,
  postStepFN,
  metadata,
}) {
  win.$WBBehaviorStepIter$ = behaviorStepIterator;
  const runner = new BehaviorRunner({
    behaviorStepIterator,
    postStepFN,
    metadata,
  });
  win.$WBBehaviorRunner$ = runner;
  win.$WRIteratorHandler$ = runner.step;
  const crect = win.document.documentElement.getBoundingClientRect();
  const x = Math.floor(Math.random() * crect.right - 100);
  const y = Math.floor(Math.random() * crect.bottom - 100);
  win.document.dispatchEvent(
    createMouseEvent({
      type: 'mousemove',
      position: {
        pageX: x,
        pageY: y,
        clientX: x,
        clientY: y,
        screenX: Math.floor(Math.random() * win.screen.width),
        screenY: Math.floor(Math.random() * win.screen.height),
      },
    })
  );
  return runner;
}

/**
 * @typedef {Object} BehaviorRunnerOpts
 * @property {RawBehaviorIterator} behaviorStepIterator - An async iterator that
 * yields the state of the behavior
 * @property {function(results: RawBehaviorStepResults): BehaviorStepResults} [postStepFN] - An optional
 * function that is supplied the state of the behavior after performing an action.
 * It is required that this function returns the state unmodified or a transformation
 * of the state that is either an object that contains the original value of the done property
 * or a boolean that is the value of the original done property.
 * @property {Object} [metadata] - Optional metadata about the behavior currently being run
 */

/**
 * @typedef {Object} BehaviorRunnerInitOpts
 * @property {Window} win
 * @property {RawBehaviorIterator} behaviorStepIterator - An async iterator that
 * yields the state of the behavior
 * @property {function(results: RawBehaviorStepResults): BehaviorStepResults} [postStepFN] - An optional
 * function that is supplied the state of the behavior after performing an action.
 * It is required that this function returns the state unmodified or a transformation
 * of the state that is either an object that contains the original value of the done property
 * or a boolean that is the value of the original done property.
 * @property {Object} [metadata] - Optional metadata about the behavior currently being run
 */

/**
 * @typedef {Object} BehaviorRunnerAsyncIterator
 * @property {function(): Promise<BehaviorStepResults>} next - function used to initiate the next action of the behavior
 */

/**
 * @typedef {Object} BehaviorRunOptions
 * @property {number} [delayAmount = 1000] - Time value in milliseconds representing how much time should be waited after initiating a behavior's step
 * @property {boolean} [noOutlinks = true] - Should the collection of outlinks be disabled when running the behavior
 * @property {boolean} [logging = true] - Should information the behavior sends be displayed
 */

/**
 * @typedef {AsyncIterator<RawBehaviorStepResults>|AsyncIterableIterator<RawBehaviorStepResults>} RawBehaviorIterator
 */
