/**
 * @desc Waits for the value of `window.location.href` to differ from
 * the supplied value due to browser history manipulation. If actual navigation
 * causes a change this function is useless.  The default poll rate is 1 second
 * and the safety timeout is 5 seconds.
 * @param {string} previousLocation - The value of `window.location.href` prior
 * to the pending or already occurred history manipulation of `window.location`
 * @param {{pollRate: ?number, safety: ?number}} [options] - Optional options
 * for controlling the checks poll rate and the safety timeout length.
 * Supplied values for `pollRate` and `safety` in milliseconds.
 * @return {Promise<boolean>} - Returns false if no change was detected by
 * the timeout length determined by options.safety otherwise true.
 */
export function waitForHistoryManipToChangeLocation(previousLocation, options) {
  const opts = Object.assign({ pollRate: 1000, safety: 5000 }, options);
  let pollInterval;
  let safetyTimeout;
  return new Promise(resolve => {
    if (window.location.href !== previousLocation) return resolve(true);
    pollInterval = setInterval(() => {
      if (window.location.href !== previousLocation) {
        if (safetyTimeout) {
          clearTimeout(safetyTimeout);
        }
        clearInterval(pollInterval);
        return resolve(true);
      }
    }, opts.pollRate);
    safetyTimeout = setTimeout(() => {
      if (pollInterval) clearInterval(pollInterval);
      resolve(window.location.href !== previousLocation);
    }, opts.safety);
  });
}

/**
 * @desc Determines the strict equality of the string
 * to the value of `window.location.href`
 * @param {string} someLocation - The expect location.href value
 * @return {boolean}
 */
export function locationEquals(someLocation) {
  return window.location.href === someLocation;
}

export function browserLocation() {
  return window.location.href;
}

/**
 * @desc Determines if `window.location.href` contains
 * the supplied value as a substring.
 * @param {string} something - The value to determine if
 * it is a substring of `window.location.href`
 * @return {boolean}
 */
export function locationContains(something) {
  return window.location.href.indexOf(something) !== -1;
}

export function browserHistoryGoBack(backLocation) {
  return new Promise((resolve, reject) => {
    history.go(-1);
    let pollInterval = setInterval(() => {
      if (window.location.href === backLocation) {
        clearInterval(pollInterval);
        return resolve(true);
      }
    }, 1500);
  });
}
