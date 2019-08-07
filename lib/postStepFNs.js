/**
 * The default post step function used for all behaviors that do not provide one.
 * @param {RawBehaviorStepResults} rawResults
 * @return {BehaviorStepResults}
 */
export function doneOrWait(rawResults) {
  const result = {
    done: rawResults.done,
    wait: false,
    msg: 'No message',
    state: null,
  };
  if (typeof rawResults.value === 'object') {
    result.wait = !!rawResults.value.wait;
    result.msg = rawResults.value.msg || result.msg;
    result.state = rawResults.value.state || result.state;
  } else {
    result.wait = !!rawResults.value;
  }
  return result;
}

/**
 * Creates and returns a function wrapping the provided post step function
 * will call the supplied function and return the expected output.
 * @param {function(rawResults: RawBehaviorStepResults): void} customFN
 * @return {function(state: RawBehaviorStepResults): BehaviorStepResults}
 */
export function buildCustomPostStepFn(customFN) {
  return function wrappedPostStep(state) {
    customFN(state);
    return doneOrWait(state);
  };
}

/**
 * @typedef {Object} BehaviorStepResults
 * @property {boolean} done - Has the behavior finished performing its actions
 * @property {boolean} wait - Should a wait for network idle be performed if possible by the runner
 * @property {string} msg - A message from the behavior representing a description of the action just performed
 * @property {*} state - Any additional information about the full state of the behavior
 */

/**
 * @typedef {Object} RawBehaviorStepResults
 * @property {boolean} done - Is the generator finished
 * @property {?BehaviorState} value - The value yielded by the behavior
 */
