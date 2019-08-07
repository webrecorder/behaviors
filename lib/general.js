/**
 * Retrieves the property of an object, or item in array at index, based
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
  let cur = obj[pathItems[0]];
  for (let i = 1; i < pathItems.length; i++) {
    cur = cur[pathItems[i]];
    if (cur == null) return null;
  }
  return cur;
}

/**
 * Initiates an pywb/webrecorder auto-fetch of content
 */
export function autoFetchFromDoc() {
  if (window.$WBAutoFetchWorker$) {
    window.$WBAutoFetchWorker$.extractFromLocalDoc();
  }
}

/**
 * Sends the supplied array of URLs to the backing pywb/webrecorder auto-fetch worker if it exists
 * @param {Array<string>} urls
 */
export function sendAutoFetchWorkerURLs(urls) {
  if (window.$WBAutoFetchWorker$) {
    window.$WBAutoFetchWorker$.justFetch(urls);
  }
}

/**
 * This function is a no op
 */
export function noop() {}

/**
 * Automatically binds the non-inherited functions of the supplied
 * class to itself.
 * @param clazz
 */
export function autobind(clazz) {
  const clazzProps = Object.getOwnPropertyNames(clazz.constructor.prototype);
  let prop;
  let propValue;
  for (var i = 0; i < clazzProps.length; ++i) {
    prop = clazzProps[i];
    propValue = clazz[prop];
    if (prop !== 'constructor' && typeof propValue === 'function') {
      clazz[prop] = propValue.bind(clazz);
    }
  }
}

/**
 * Returns T/F if the supplied object has all of the supplied properties.
 * The existence check is `obj[prop] != null`
 * @param {Object} obj - The object to be tested
 * @param {...string} props - The property names
 * @return {boolean}
 */
export function objectHasProps(obj, ...props) {
  if (obj == null) return false;
  for (var i = 0; i < props.length; ++i) {
    if (obj[props[i]] == null) return false;
  }
  return true;
}

/**
 * Returns T/F if an global property (on window) exists and has
 * all properties. The existence check is `obj[prop] != null`
 * @param {string} global - The name of the global
 * @param {...string} props - The property names
 * @return {boolean}
 */
export function globalWithPropsExist(global, ...props) {
  const obj = window[global];
  if (obj == null) return false;
  for (var i = 0; i < props.length; ++i) {
    if (obj[props[i]] == null) return false;
  }
  return true;
}

/**
 * Returns a new object with the properties of the object
 * on the new object
 * @param {?Object} object - The object to extract properties from
 * @param {...string} props - The property names to be extracted
 * @return {?Object} - The new object if the original object was not null
 */
export function extractProps(object, ...props) {
  if (object == null) return null;
  const extracted = {};
  for (var i = 0; i < props.length; ++i) {
    extracted[props[i]] = object[props[i]];
  }
  return extracted;
}

/**
 * Composes multiple functions from right to left into a single function.
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
 * Composes multiple async or Promise returning functions from right to
 * left into a single function. The rightmost function can take multiple arguments
 * with the remaining functions taking only a single argument, the return value
 * of the previous invocation.
 * @param {...function(...args: *): Promise<*>} funcs - The functions to compose.
 * @return {function(...args: *): Promise<*>} - A function obtained by composing the functions
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
 * Composes multiple Iterator returning functions from right to
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
 * Composes multiple AsyncIterator returning functions from right to
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
 * Creates a Promise that is resolvable externally returning an object
 * that exposes the promise itself and the resolve and reject functions
 * passed as arguments to the executor function
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
 * @param {*} [a1] - 1st arg
 * @param {*} [a2] - 2nd arg
 * @param {*} [a3] - 3rd arg
 * @param {*} [a4] - 4th arg
 * @param {*} [a5] - 5th arg
 * @param {...*} [aN] - The remaining arguments to be partially applied
 * @return {function(...args: *): *} - Returns the new partially applied function
 */
export function partial(fn, a1, a2, a3, a4, a5, ...aN) {
  if (a1 == null) return fn;
  if (aN.length) {
    return (...args) => fn(a1, a2, a3, a4, a5, ...aN, ...args);
  }
  if (a5 != null) return (...args) => fn(a1, a2, a3, a4, a5, ...args);
  if (a4 != null) return (...args) => fn(a1, a2, a3, a4, ...args);
  if (a3 != null) return (...args) => fn(a1, a2, a3, ...args);
  if (a2 != null) return (...args) => fn(a1, a2, ...args);
  return (...args) => fn(a1, ...args);
}

/**
 * Creates and returns a partially applied function with args being applied right to left
 * @param {function} fn - The function to partially apply arguments to
 * @param {*} [a1] - 1st nth arg
 * @param {*} [a2] - 2nd nth arg
 * @param {*} [a3] - 3rd nth arg
 * @param {*} [a4] - 4th nth arg
 * @param {*} [a5] - 5th nth arg
 * @param {...*} [aN] - The remaining arguments to be partially applied
 * @return {function(...args: *): *} - Returns the new partially applied function
 */
export function partialRight(fn, a1, a2, a3, a4, a5, ...aN) {
  if (a1 == null) return fn;
  if (aN.length) {
    return (...args) => fn(...args, a1, a2, a3, a4, a5, ...aN);
  }
  if (a5 != null) return (...args) => fn(...args, a1, a2, a3, a4, a5);
  if (a4 != null) return (...args) => fn(...args, a1, a2, a3, a4);
  if (a3 != null) return (...args) => fn(...args, a1, a2, a3);
  if (a2 != null) return (...args) => fn(...args, a1, a2);
  return (...args) => fn(...args, a1);
}
/** @ignore */
let __BytesToHex__;

/**
 * Creates and returns a valid uuid v4
 * @return {string}
 */
export function uuidv4() {
  if (__BytesToHex__ == null) {
    __BytesToHex__ = new Array(256);
    for (let i = 0; i < 256; ++i) {
      __BytesToHex__[i] = (i + 0x100).toString(16).substr(1);
    }
  }
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40;
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80;
  return [
    __BytesToHex__[randomBytes[0]],
    __BytesToHex__[randomBytes[1]],
    __BytesToHex__[randomBytes[2]],
    __BytesToHex__[randomBytes[3]],
    '-',
    __BytesToHex__[randomBytes[4]],
    __BytesToHex__[randomBytes[5]],
    '-',
    __BytesToHex__[randomBytes[6]],
    __BytesToHex__[randomBytes[7]],
    '-',
    __BytesToHex__[randomBytes[8]],
    __BytesToHex__[randomBytes[9]],
    '-',
    __BytesToHex__[randomBytes[10]],
    __BytesToHex__[randomBytes[11]],
    __BytesToHex__[randomBytes[12]],
    __BytesToHex__[randomBytes[13]],
    __BytesToHex__[randomBytes[14]],
    __BytesToHex__[randomBytes[15]],
  ].join('');
}

/**
 * Returns T/F indicating if the supplied object is a generator or async generator
 * @param {*} obj
 * @return {boolean}
 */
export function isGenerator(obj) {
  if (!obj) return false;
  const tag = obj[Symbol.toStringTag];
  if (tag === 'AsyncGenerator' || tag === 'Generator') return true;
  if (isFunction(obj.next) && isFunction(obj.throw) && isFunction(obj.return)) {
    return true;
  }
  if (!obj.constructor) return false;
  const ctag = obj.constructor[Symbol.toStringTag];
  return ctag === 'GeneratorFunction' || ctag === 'AsyncGeneratorFunction';
}

/**
 * Returns T/F indicating if the supplied object is a Promise or Promise like
 * @param {*} obj
 * @return {boolean}
 */
export function isPromise(obj) {
  if (!obj) return false;
  return (
    obj instanceof Promise ||
    (typeof obj === 'object' &&
      isFunction(obj.then) &&
      isFunction(obj.catch)) ||
    obj[Symbol.toStringTag] === 'Promise'
  );
}

/**
 * Returns T/F indicating if the supplied arument is a function
 * @param {*} obj
 * @return {boolean}
 */
export function isFunction(obj) {
  return typeof obj === 'function';
}

/**
 * Like map for arrays but over async-iterators
 * @param {AsyncIterableIterator<*>} iterator - The iterator
 * to have a mapping function applied over
 * @param {function(arg: *): *} mapper - The mapping function
 * @return {AsyncIterableIterator<*>}
 */
export async function* mapAsyncIterator(iterator, mapper) {
  for await (const item of iterator) {
    const nextValue = mapper(item);
    if (isGenerator(nextValue)) {
      for await (const next of noExceptGeneratorWrap(nextValue)) {
        yield next;
      }
    } else yield nextValue;
  }
}

/**
 * Wraps the supplied generator in a try catch and re-yields its values generator.
 * If the wrapped generator throws an exception the wrapping generator ends.
 * @param {AsyncIterableIterator<*>|IterableIterator<*>} generator - The generator to be wrapped
 * @param {boolean} [returnLast] - Should the last value of the supplied generator be returned
 * @return {AsyncIterableIterator<*>}
 */
export async function* noExceptGeneratorWrap(generator, returnLast) {
  try {
    let next;
    let nv;
    while (true) {
      next = generator.next();
      if (isPromise(next)) nv = await next;
      else nv = next;
      if (nv.done) {
        if (nv.value) {
          if (returnLast) return nv.value;
          else yield nv.value;
        }
        break;
      } else {
        yield nv.value;
      }
    }
  } catch (e) {}
}
