/**
 * Returns a behavior state object with the supplied msg indicating
 * the behavior runner should not wait for network idle.
 * The value returned should be yield'd to the behavior
 * runner
 * @param {string} msg
 * @return {{msg: string, wait: boolean}}
 */
export function stateWithMsgNoWait(msg) {
  return { wait: false, msg };
}

/**
 * Returns a behavior state object with the supplied msg indicating
 * the behavior runner should wait for network idle.
 * The value returned should be yield'd to the behavior
 * runner
 * @param {string} msg
 * @return {{msg: string, wait: boolean}}
 */
export function stateWithMsgWait(msg) {
  return { wait: true, msg };
}

/**
 * Returns a behavior state object with the supplied wait
 * and msg values. The value returned should be yield'd
 * to the behavior runner
 * @param {boolean} wait
 * @param {string} msg
 * @return {{msg: string, wait: boolean}}
 */
export function createState(wait, msg) {
  return { wait, msg };
}

/**
 * Returns a behavior state object with the supplied msg with the wait
 * value being set by the return value of the supplied function.
 * The value returned should be yield'd to the behavior runner
 * @param {function(): boolean} fn
 * @param {string} msg
 * @return {{msg: string, wait: boolean}}
 */
export function stateWithMsgWaitFromFn(fn, msg) {
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
 * @param {string} msg
 * @return {Promise<{msg: string, wait: boolean}>}
 */
export async function stateWithMsgWaitFromAwaitable(awaitable, msg) {
  let wait = false;
  try {
    wait = await awaitable;
  } catch (e) {
    wait = false;
  }
  return createState(wait, msg);
}
