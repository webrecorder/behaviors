/**
 * Returns a behavior state object with the supplied msg indicating
 * the behavior runner should not wait for network idle.
 * The value returned should be yield'd to the behavior
 * runner
 * @param {string} msg - A message from the behavior representing a description of the action just performed
 * @param {*} [state] - Any additional information about the full state of the behavior
 * @return {BehaviorState}
 */
export function stateWithMsgNoWait(msg, state = {}) {
  return { wait: false, msg, state };
}

/**
 * Returns a behavior state object with the supplied msg indicating
 * the behavior runner should wait for network idle.
 * The value returned should be yield'd to the behavior
 * runner
 * @param {string} msg -  A message from the behavior representing a description of the action just performed
 * @param {*} [state] - Any additional information about the full state of the behavior
 * @return {BehaviorState}
 */
export function stateWithMsgWait(msg, state = {}) {
  return { wait: true, msg, state };
}

/**
 * Returns a behavior state object with the supplied wait
 * and msg values. The value returned should be yield'd
 * to the behavior runner
 * @param {boolean} wait
 * @param {*} msg - A message from the behavior representing a description of the action just performed
 * @param {*} [state] - Any additional information about the full state of the behavior
 * @return {BehaviorState}
 */
export function createState(wait, msg, state = {}) {
  return { wait, msg, state };
}

/**
 * Returns a behavior state object with the supplied msg with the wait
 * value being set by the return value of the supplied function.
 * The value returned should be yield'd to the behavior runner
 * @param {function(): boolean} fn
 * @param {*} msg - A message from the behavior representing a description of the action just performed
 * @param {*} [state] - Any additional information about the full state of the behavior
 * @return {BehaviorState}
 */
export function stateWithMsgWaitFromFn(fn, msg, state) {
  let wait = false;
  try {
    wait = fn();
  } catch (e) {
    wait = false;
  }
  return createState(wait, msg);
}

/**
 * Returns a Promise that resolves to an behavior state object with
 * the supplied msg with the wait value being set by the value resolved Promise.
 * The value returned should be yield'd to the behavior runner
 * @param {Promise<boolean>} awaitable
 * @param {*} msg - A message from the behavior representing a description of the action just performed
 * @param {*} [state] - Any additional information about the full state of the behavior
 * @return {Promise<BehaviorState>}
 */
export async function stateWithMsgWaitFromAwaitable(awaitable, msg, state) {
  let wait = false;
  try {
    wait = await awaitable;
  } catch (e) {
    wait = false;
  }
  return createState(wait, msg, state);
}

/**
 * @typedef {Object} BehaviorState
 * @property {string} msg - A message from the behavior representing a description of the action just performed
 * @property {boolean} wait - Should a wait for network idle be performed if possible by the runner
 * @property {*} state  - Any additional information about the full state of the behavior
 */
