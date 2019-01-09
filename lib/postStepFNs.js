/**
 *
 * @param {{done: boolean, value: *}} state
 * @return {{wait: boolean, done: boolean}}
 */
export function doneOrWait(state) {
  return {
    done: state.done,
    wait: !!state.value
  };
}

/**
 *
 * @param {function(state: {done: boolean, value: *})} customFN
 * @return {function(state: {done: boolean, value: *}): {done: boolean, wait: boolean}}
 */
export function buildCustomPostStepFn(customFN) {
  return function(state) {
    customFN(state);
    return {
      done: state.done,
      wait: !!state.value
    };
  };
}
