/**
 *
 * @param {{done: boolean, value: *}} state
 * @return {{wait: boolean, done: boolean, msg: *}}
 */
export function doneOrWait(state) {
  const result = { done: state.done, wait: null, msg: null };
  if (typeof state.value === 'object') {
    result.wait = !!state.value.wait;
    result.msg = state.value.msg || 'No message';
  } else {
    result.wait = !!state.value;
  }
  return result;
}

/**
 *
 * @param {function(state: {done: boolean, value: *})} customFN
 * @return {function(state: {done: boolean, value: *}): {done: boolean, wait: boolean, msg: *}}
 */
export function buildCustomPostStepFn(customFN) {
  return function(state) {
    customFN(state);
    return doneOrWait(state);
  };
}
