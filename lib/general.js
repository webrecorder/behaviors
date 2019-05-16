/**
 * @desc Retrieves the property of an object, or item in array at index, based
 * on the supplied path.
 * @example
 *   const obj = { a: { b: { c: [1, 2, 3] } } }
 *   const two = getViaPath(obj, 'a', 'b', 'c', 1); // two == 2
 * @param {*} obj - An object
 * @param {*} pathItems
 * @return {*}
 */
export function getViaPath(obj, ...pathItems) {
  if (obj == null || pathItems.length === 0) return null;
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

export function sendAutoFetchWorkerURLs(urls) {
  if (window.$WBAutoFetchWorker$) {
    window.$WBAutoFetchWorker$.justFetch(urls);
  }
}

/**
 * @desc This function is a no op
 */
export function noop() {}

/**
 * @param {string} url
 * @param {Window} [win]
 * @return {Promise<Response>}
 */
export function safeFetch(url, win) {
  if (win != null) return win.fetch(url).catch(noop);
  return fetch(url).catch(noop);
}

/**
 * @desc Automatically binds the non-inherited functions of the supplied
 * class to itself.
 * @param clazz
 */
export function autobind(clazz) {
  const clazzProps = Object.getOwnPropertyNames(clazz.constructor.prototype);
  let i = clazzProps.length;
  let prop;
  let propValue;
  while (i--) {
    prop = clazzProps[i];
    propValue = clazz[prop];
    if (prop !== 'constructor' && typeof propValue === 'function') {
      clazz[prop] = propValue.bind(clazz);
    }
  }
}

/**
 * @desc Returns T/F if the supplied object has all of the supplied properties.
 * The existence check is `obj[prop] != null`
 * @param {Object} obj - The object to be tested
 * @param {...string} props - The property names
 * @return {boolean}
 */
export function objectHasProps(obj, ...props) {
  if (obj == null) return false;
  let i = props.length;
  while (i--) {
    if (obj[props[i]] == null) return false;
  }
  return true;
}

/**
 * @desc Returns T/F if an global property (on window) exists and has
 * all properties. The existence check is `obj[prop] != null`
 * @param {string} global - The name of the global
 * @param {...string} props - The property names
 * @return {boolean}
 */
export function globalWithPropsExist(global, ...props) {
  const obj = window[global];
  if (obj == null) return false;
  let i = props.length;
  while (i--) {
    if (obj[props[i]] == null) return false;
  }
  return true;
}

/**
 * @desc Returns a new object with the properties of the object
 * on the new object
 * @param {?Object} object - The object to extract properties from
 * @param {...string} props - The property names to be extracted
 * @return {?Object} - The new object if the original object was not null
 */
export function extractProps(object, ...props) {
  if (object == null) return null;
  const extracted = {};
  let i = props.length;
  while (i--) {
    extracted[props[i]] = object[props[i]];
  }
  return extracted;
}

/**
 * @desc Composes multiple functions from right to left into a single function.
 * The rightmost function can take multiple arguments with the remaining
 * functions taking only a single argument, the return value of the previous
 * invocation.
 * @param {...function(...args: *): *} funcs - The functions to compose.
 * @return {function(...args: *): *} - A function obtained by composing the functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */
export function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

/**
 * @desc Composes multiple async or Promise returning functions from right to
 * left into a single function. The rightmost function can take multiple arguments
 * with the remaining functions taking only a single argument, the return value
 * of the previous invocation.
 * @param {...function(...args:*): Promise<*>} funcs - The functions to compose.
 * @return {function(...args:*): Promise<*>} - A function obtained by composing the functions
 * from right to left. For example, composeAsync(f, g, h) is identical to doing
 * (...args) => h(...args).then(result => g(result).then(result => f(result)).
 */
export function composeAsync(...funcs) {
  if (funcs.length === 0) {
    return async function() {
      return arguments[0];
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((a, b) => (...args) => b(...args).then(a));
}

/**
 * @desc Composes multiple Iterator returning functions from right to
 * left into a single function. The rightmost function can take multiple arguments
 * with the remaining functions taking only a single argument, the iterator returned
 * by the previous invocation. The composition of iterators can thought of
 * as chaining multiple iterators together, that is to say feeding the yielded results
 * of each iterator from right to left. This can be useful for chaining cascading
 * ordered actions.
 * @example
 *   function* iter1(iter) {
 *     console.log('start iter1');
 *     for (const value of iter) {
 *       yield `iter1 got "${value}" from the previous iter`;
 *     }
 *     yield 'end iter1';
 *   }
 *
 *   function* iter2(iter) {
 *     console.log('start iter2');
 *     for (const value of iter) {
 *       yield `iter2 got "${value}" from the previous iter`;
 *     }
 *     yield 'end iter2';
 *   }
 *
 *   function* iter3(...args) {
 *     console.log('start iter3');
 *     let i = args.length;
 *     while (i--) {
 *       yield args[i];
 *     }
 *    yield 'end iter3';
 *  }
 *
 *  const finalIter = composeIterators(iter1, iter2, iter3)(1, 2, 3, 4, 5);
 *
 *  for (const it of finalIter) {
 *    console.log(it);
 * }
 *
 *  // The output is as follows
 *  // logs "start iter" from iter1
 *  // logs "start iter2" from iter2
 *  // logs "start iter3" from iter3
 *  // logs 'iter1 got "iter2 got "5" from the previous iter" from the previous iter' from the for of finalIter
 *  // logs 'iter1 got "iter2 got "4" from the previous iter" from the previous iter' from the for of finalIter
 *  // logs 'iter1 got "iter2 got "3" from the previous iter" from the previous iter' from the for of finalIter
 *  // logs 'iter1 got "iter2 got "2" from the previous iter" from the previous iter' from the for of finalIter
 *  // logs 'iter1 got "iter2 got "1" from the previous iter" from the previous iter' from the for of finalIter
 *  // logs 'iter1 got "iter2 got "end iter3" from the previous iter" from the previous iter' from the for of finalIter
 *  // logs 'iter1 got "end iter2" from the previous iter' from the for of finalIter
 *  // logs 'end iter1' from the for of finalIter
 *
 * @param {...function(...args:*): Iterator<*>} funcs - The Iterator returning functions to be composed (chained)
 * @return {function(...args:*): Iterator<*>} - A function obtained by composing the functions
 * from right to left. See the documentations example for details
 */
export function composeIterators(...funcs) {
  if (funcs.length === 0) {
    return function*() {
      yield arguments[0];
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce(
    (a, b) =>
      function*(...args) {
        yield* a(b(...args));
      }
  );
}

/**
 * @desc Composes multiple AsyncIterator returning functions from right to
 * left into a single function. The rightmost function can take multiple arguments
 * with the remaining functions taking only a single argument, the iterator returned
 * by the previous invocation. The composition of AsyncIterator can thought of
 * as chaining multiple AsyncIterator together, that is to say feeding the yielded results
 * of each iterator from right to left. This can be useful for chaining cascading asynchronous
 * ordered actions.
 * @example
 *   async function* iter1(iter) {
 *     console.log('start iter1');
 *     for await (const value of iter) {
 *       yield `iter1 got "${value}" from the previous iter`;
 *     }
 *     yield 'end iter1';
 *   }
 *
 *   async function* iter2(iter) {
 *     console.log('start iter2');
 *     for await (const value of iter) {
 *       yield `iter2 got "${value}" from the previous iter`;
 *     }
 *     yield 'end iter2';
 *   }
 *
 *   async function* iter3(...args) {
 *     console.log('start iter3');
 *     let i = args.length;
 *     while (i--) {
 *       yield args[i];
 *     }
 *    yield 'end iter3';
 *  }
 *
 *  const finalAIter = composeAsyncIterators(iter1, iter2, iter3)(1, 2, 3, 4, 5);
 *
 *  (async () => {
 *    for await (const it of finalAIter) {
 *      console.log(it);
 *    }
 *  })();
 *
 *  // The output is as follows
 *  // logs "start iter" from iter1
 *  // logs "start iter2" from iter2
 *  // logs "start iter3" from iter3
 *  // logs 'iter1 got "iter2 got "5" from the previous iter" from the previous iter' from the for await of finalAiter
 *  // logs 'iter1 got "iter2 got "4" from the previous iter" from the previous iter' from the for await of finalAiter
 *  // logs 'iter1 got "iter2 got "3" from the previous iter" from the previous iter' from the for await of finalAiter
 *  // logs 'iter1 got "iter2 got "2" from the previous iter" from the previous iter' from the for await of finalAiter
 *  // logs 'iter1 got "iter2 got "1" from the previous iter" from the previous iter' from the for await of finalAiter
 *  // logs 'iter1 got "iter2 got "end iter3" from the previous iter" from the previous iter' from the for await of finalAiter
 *  // logs 'iter1 got "end iter2" from the previous iter' from the for await of finalAiter
 *  // logs 'end iter1' from the for await of finalAiter
 *
 * @param {...function(...args:*): AsyncIterator<*>} funcs - The AsyncIterator returning functions to be composed (chained)
 * @return {function(...args:*): AsyncIterator<*>} - A function obtained by composing the functions
 * from right to left. See the documentations example for details
 */
export function composeAsyncIterators(...funcs) {
  if (funcs.length === 0) {
    return async function*() {
      yield arguments[0];
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce(
    (a, b) =>
      async function*(...args) {
        yield* a(b(...args));
      }
  );
}

/**
 * @return {{resolve: function, reject: function, promise: Promise<*>}}
 */
export function promiseResolveReject() {
  const promResolveReject = { promise: null, resolve: null, reject: null };
  promResolveReject.promise = new Promise((resolve, reject) => {
    promResolveReject.resolve = resolve;
    promResolveReject.reject = reject;
  });
  return promResolveReject;
}

/**
 * Returns T/F indicating if the supplied object is an instance of some class.
 * If the object to be tested is falsy false is returned otherwise the results
 * of the instanceof check.
 * @param {Object} obj - The object to be tested
 * @param {Object} shouldBeInstanceOfThis - The class the obj should be an instance of
 * @return {boolean}
 */
export function objectInstanceOf(obj, shouldBeInstanceOfThis) {
  if (!obj) return false;
  return obj instanceof shouldBeInstanceOfThis;
}

/**
 * Creates and returns a partially applied function with args being applied left to right
 * @param {function} fn - The function to partially apply arguments to
 * @param {...*} values - The arguments to be partially applied
 * @return {function(...[*]): *} - Returns the new partially applied function
 */
export function partial(fn, ...values) {
  return (...args) => fn(...values, ...args);
}

/**
 * Creates and returns a partially applied function with args being applied right to left
 * @param {function} fn - The function to partially apply arguments to
 * @param {...*} values - The arguments to be partially applied
 * @return {function(...[*]): *} - Returns the new partially applied function
 */
export function partialRight(fn, ...values) {
  return (...args) => fn( ...args, ...values);
}