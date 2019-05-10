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
