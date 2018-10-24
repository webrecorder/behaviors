
/**
 * @desc Retrieves the property of an object, or item in array at index, based
 * on the supplied path.
 * @example
 *   const obj = { a: { b: { c: [1, 2, 3] } } }
 *   const two = getViaPath(obj, 'a', 'b', 'c', 1); // two == 2
 * @param {Object | Array | Element | Node} obj
 * @param {string | number} pathItems
 * @return {any}
 */
export function getViaPath(obj, ...pathItems) {
  let cur = obj[pathItems.shift()];
  if (cur == null) return null;
  while (pathItems.length) {
    cur = cur[pathItems.shift()];
    if (cur == null) return null;
  }
  return cur;
}

let didPauseAutoFetching = false;

export function autoFetchFromDoc() {
  if (window.$WBAutoFetchWorker$) {
    window.$WBAutoFetchWorker$.extractFromLocalDoc();
  }
}

export function sendAutoFetchWorkerURLs (urls) {
  if (window.$WBAutoFetchWorker$) {
    window.$WBAutoFetchWorker$.justFetch(urls);
  }
}

export function noop() {}

/**
 * @param {string} url
 * @param {Window} [win]
 * @return {Promise<Response>}
 */
export function safeFetch (url, win) {
  if (win != null) return win.fetch(url).catch(noop);
  return fetch(url).catch(noop);
}
