import { waitForAdditionalElemChildren } from './delays';
import { getElemSiblingAndRemoveElem, childElementIterator } from './dom';
import {
  isGenerator,
  isPromise,
  isFunction,
  noExceptGeneratorWrap,
} from './general';

/**
 * Applies a function to the children of the supplied parent element yielding the return value of the function.
 *
 * When a child of the parent element does not have a next element sibling a wait
 * for additional child elements to be added is done for a maximum of 15 seconds and
 * if the current child element still does not have a next element sibling the generator ends.
 *
 * @param {SomeElement} parentElement - The parent element who's children are to be traversed
 * @param {function(element: SomeElement, additionalArgs: *): *} fn - The function to be applied to each child element
 * @param {*} [additionalArgs] - Any additional arguments to be supplied to the function applied to each child element
 * @return {AsyncIterableIterator<*>}
 */
export async function* traverseChildrenOfLoaderParent(
  parentElement,
  fn,
  additionalArgs
) {
  if (parentElement == null) return;
  for await (const child of walkChildrenOfCustom({
    parentElement,
    loader: true,
  })) {
    const nextValue = fn(child, additionalArgs);
    if (isGenerator(nextValue)) {
      for await (const next of noExceptGeneratorWrap(nextValue)) {
        yield next;
      }
    } else {
      yield isPromise(nextValue) ? await nextValue : nextValue;
    }
  }
}

/**
 * Applies a function to the children of the supplied parent element yielding the return value of the function
 * and then removing the previously considered child element from the DOM.
 *
 * When a child of the parent element does not have a next element sibling a wait
 * for additional child elements to be added is done for a maximum of 15 seconds and
 * if the current child element still does not have a next element sibling the generator ends.
 *
 * @param {SomeElement} parentElement - The parent element who's children are to be traversed
 * @param {function(element: SomeElement, additionalArgs: *): *} fn - The function to be applied to each child element
 * @param {*} [additionalArgs] - Any additional arguments to be supplied to the function applied to each child element
 * @return {AsyncIterableIterator<*>}
 */
export async function* traverseChildrenOfLoaderParentRemovingPrevious(
  parentElement,
  fn,
  additionalArgs
) {
  if (parentElement == null) return;
  for await (const child of walkChildrenOfCustom({
    parentElement,
    loader: true,
    nextChild(parent, currentChild) {
      return getElemSiblingAndRemoveElem(currentChild);
    },
  })) {
    const nextValue = fn(child, additionalArgs);
    if (isGenerator(nextValue)) {
      for await (const next of noExceptGeneratorWrap(nextValue)) {
        yield next;
      }
    } else {
      yield isPromise(nextValue) ? await nextValue : nextValue;
    }
  }
}

/**
 * Applies a function to the children of the supplied parent element yielding the return value of the function.
 *
 * When a child of the parent element does not have a next element sibling the generator ends.
 *
 * @param {SomeElement} parentElement - The parent element who's children are to be traversed
 * @param {function(element: SomeElement, additionalArgs: *): *} fn - The function to be applied to each child element
 * @param {*} [additionalArgs] - Any additional arguments to be supplied to the function applied to each child element
 * @return {AsyncIterableIterator<*>}
 */
export async function* traverseChildrenOf(parentElement, fn, additionalArgs) {
  if (parentElement == null) return;
  for (const child of childElementIterator(parentElement)) {
    const nextValue = fn(child, additionalArgs);
    if (isGenerator(nextValue)) {
      for await (const next of noExceptGeneratorWrap(nextValue)) {
        yield next;
      }
    } else {
      yield isPromise(nextValue) ? await nextValue : nextValue;
    }
  }
}

/**
 * Applies a function to the children of the supplied parent element yielding the return value of the function
 * and then removing the previously considered child element from the DOM.
 *
 * When a child of the parent element does not have a next element sibling the generator ends.
 *
 * @param {SomeElement} parentElement - The parent element who's children are to be traversed
 * @param {function(element: SomeElement, additionalArgs: *): *} fn - The function to be applied to each child element
 * @param {*} [additionalArgs] - Any additional arguments to be supplied to the function applied to each child element
 * @return {AsyncIterableIterator<*>}
 */
export async function* traverseChildrenOfRemovingPrevious(
  parentElement,
  fn,
  additionalArgs
) {
  if (parentElement == null) return;
  for await (const child of walkChildrenOfCustom({
    parentElement,
    loader: false,
    nextChild(parent, currentChild) {
      return getElemSiblingAndRemoveElem(currentChild);
    },
  })) {
    const nextValue = fn(child, additionalArgs);
    if (isGenerator(nextValue)) {
      for await (const next of noExceptGeneratorWrap(nextValue)) {
        yield next;
      }
    } else {
      yield isPromise(nextValue) ? await nextValue : nextValue;
    }
  }
}

/**
 * Applies a function to the children of the supplied parent element yielding the return value of the function.
 *
 * When a child of the parent element does not have a next element sibling, the supplied genFun is called and a wait
 * for additional child elements to be added is done for a maximum of 15 seconds.
 * After the wait ends and if the current child element still does not have a next element sibling the generator ends.
 *
 * @param {SomeElement} parentElement - The parent element who's children are to be traversed
 * @param {function(): BoolOrPromiseBool} genFn - Function used to generator more elements returning T/F indicating if
 * a wait should be done
 * @param {function(element: SomeElement, additionalArgs: *): *} fn - The function to be applied to each child element
 * @param {*} [additionalArgs] - Any additional arguments to be supplied to the function applied to each child element
 * @return {AsyncIterableIterator<*>}
 */
export async function* traverseChildrenOfLoaderParentGenFn(
  parentElement,
  fn,
  genFn,
  additionalArgs
) {
  if (parentElement == null) return;
  for await (const child of walkChildrenOfCustom({
    parentElement,
    loader: true,
    async shouldWait(parent, currentChild) {
      if (currentChild.nextElementSibling != null) return false;
      const fromGen = genFn();
      return isPromise(fromGen) ? await fromGen : fromGen;
    },
  })) {
    const nextValue = fn(child, additionalArgs);
    if (isGenerator(nextValue)) {
      for await (const next of noExceptGeneratorWrap(nextValue)) {
        yield next;
      }
    } else {
      yield isPromise(nextValue) ? await nextValue : nextValue;
    }
  }
}

/**
 * Walks the children of the supplied parent element yielding its children.
 *
 * If the loader option is true or shouldWait and or wait function(s) are supplied then the walk
 * behaves as if the loader was set to true.
 *
 * When operating in loader mode and a child of the parent element does not have a next element sibling, a wait
 * for additional child elements to be added is done, if no custom wait function was supplied the wait happens for a maximum of 15 seconds.
 * After the wait ends and if the current child element still does not have a next element sibling the generator ends.
 *
 * When not operating in loader mode and the current child element does not have a next element sibling the traversal ends.
 *
 * See the documentation for {@link WalkChildrenOfCustomOpts} for the customization options available
 * @param {WalkChildrenOfCustomOpts} opts - Options for configuring the walk
 * @return {AsyncIterableIterator<SomeElement>}
 */
export async function* walkChildrenOfCustom(opts) {
  if (!opts) return;
  const {
    parentElement,
    waitOptions,
    selector,
    filter,
    nextChild = (parent, child) => child.nextElementSibling,
  } = opts;
  let isLoader = !!opts.loader;
  if (!isLoader && (isFunction(opts.shouldWait) || isFunction(opts.wait))) {
    isLoader = true;
  }
  let shouldWait;
  let wait;
  if (isLoader) {
    shouldWait = isFunction(opts.shouldWait)
      ? opts.shouldWait
      : (parent, child) => child.nextElementSibling == null;
    wait = isFunction(opts.wait)
      ? opts.wait
      : (parent, child) => waitForAdditionalElemChildren(parent, waitOptions);
  }
  let curChild = parentElement.firstElementChild;
  let useChild;
  let nextChildValue;
  while (curChild != null) {
    useChild = filter ? filter(curChild) : true;
    if (isPromise(useChild) ? await useChild : useChild) {
      yield selector ? selector(curChild) : curChild;
    }
    if (isLoader) {
      const shouldWaitValue = shouldWait(parentElement, curChild);
      if (
        isPromise(shouldWaitValue) ? await shouldWaitValue : shouldWaitValue
      ) {
        await wait(parentElement, curChild);
      }
    }
    nextChildValue = nextChild(parentElement, curChild);
    curChild = isPromise(nextChildValue)
      ? await nextChildValue
      : nextChildValue;
  }
}

/**
 * Traverses the children of the supplied element applying the supplied function to each child and yielding
 * the return value of the function.
 *
 * If the loader option is true or shouldWait and or wait function(s) are supplied then the walk
 * behaves as if the loader was set to true.
 *
 * When operating in loader mode and a child of the parent element does not have a next element sibling, a wait
 * for additional child elements to be added is done, if no custom wait function was supplied the wait happens for a maximum of 15 seconds.
 * After the wait ends and if the current child element still does not have a next element sibling the generator ends.
 *
 * When not operating in loader mode and the current child element does not have a next element sibling the traversal ends.
 *
 * See the documentation for {@link TraversalOpts} for the customization options available.
 * @param {TraversalOpts} opts - Options for configuring the traversal
 * @return {AsyncIterableIterator<*>}
 */
export async function* traverseChildrenOfCustom(opts) {
  if (!opts) return;
  if (isFunction(opts.preTraversal)) {
    const preValue = opts.preTraversal();
    if (isGenerator(preValue)) {
      for await (const preNext of noExceptGeneratorWrap(preValue)) {
        yield preNext;
      }
    } else if (isPromise(preValue)) {
      await preValue;
    }
  }
  let parentElement;
  if (isFunction(opts.setup)) {
    const parentElemOrPromise = opts.setup();
    parentElement = isPromise(parentElemOrPromise)
      ? await parentElemOrPromise
      : parentElemOrPromise;
  } else {
    parentElement = opts.parentElement;
  }
  if (!parentElement) {
    if (opts.setupFailure) {
      const handlingFailure = isFunction(opts.setupFailure)
        ? opts.setupFailure()
        : opts.setupFailure;
      if (isGenerator(handlingFailure)) {
        for await (const failureNext of noExceptGeneratorWrap(
          handlingFailure
        )) {
          yield failureNext;
        }
      } else {
        yield handlingFailure;
      }
    }
    if (isFunction(opts.postTraversal)) {
      const postValue = opts.postTraversal(true);
      if (isGenerator(postValue)) {
        try {
          let next;
          let nv;
          while (true) {
            next = postValue.next();
            nv = isPromise(next) ? await next : next;
            if (nv.done) {
              if (nv.value) {
                return nv.value;
              }
              break;
            } else {
              yield nv.value;
            }
          }
        } catch (e) {}
      } else if (postValue) return postValue;
    }
    return;
  }
  for await (const child of walkChildrenOfCustom({
    parentElement,
    loader: opts.loader,
    nextChild: opts.nextChild,
    shouldWait: opts.shouldWait,
    wait: opts.wait,
    waitOptions: opts.waitOptions,
    filter: opts.filter,
    selector: opts.selector,
  })) {
    const nextValue = opts.handler(child, opts.additionalArgs);
    if (isGenerator(nextValue)) {
      for await (const next of noExceptGeneratorWrap(nextValue)) {
        yield next;
      }
    } else if (nextValue) {
      yield nextValue;
    }
  }
  if (isFunction(opts.postTraversal)) {
    const postValue = opts.postTraversal(false);
    if (isGenerator(postValue)) {
      try {
        let next;
        let nv;
        while (true) {
          next = postValue.next();
          nv = isPromise(next) ? await next : next;
          if (nv.done) {
            if (nv.value) return nv.value;
          } else {
            yield nv.value;
          }
        }
      } catch (e) {}
    } else if (postValue) {
      return postValue;
    }
  }
}

/**
 * Reasons why a walk has ended
 * @type {{failedToRefindParent: number, noMoreChildren: number, failedToRefindChild: number, failedToFindFirstParent: number, failedToFindFirstChild: number}}
 */
export const WalkEndedReasons = {
  failedToFindFirstParent: 1,
  failedToFindFirstChild: 2,
  failedToRefindParent: 3,
  failedToRefindChild: 4,
  noMoreChildren: 0,
};

/**
 * Yields the child elements of the found parent element.
 * If the parent element becomes removed from the DOM after yielding the current child,
 * the parent element and current child are re-found.
 * @param {DisconnectingWalkState} walkState
 * @return {AsyncIterableIterator<*>}
 */
export async function* disconnectingWalk(walkState) {
  let parentElem = walkState.findParentElement();
  if (!parentElem) {
    walkState.walkEndedReason = WalkEndedReasons.failedToFindFirstParent;
    return;
  }
  let currentChild = parentElem.firstElementChild;
  if (!currentChild) {
    walkState.walkEndedReason = WalkEndedReasons.failedToFindFirstChild;
    return;
  }
  while (currentChild != null) {
    yield currentChild;
    if (!parentElem.isConnected) {
      parentElem = walkState.findParentElement();
      if (!parentElem) {
        walkState.walkEndedReason = WalkEndedReasons.failedToRefindParent;
        break;
      }
      currentChild = walkState.refindCurrentChild(parentElem, currentChild);
      if (!currentChild) {
        walkState.walkEndedReason = WalkEndedReasons.failedToRefindChild;
        break;
      }
    }
    if (walkState.shouldWait(parentElem, currentChild)) {
      await walkState.wait(parentElem, currentChild);
    }
    currentChild = walkState.nextChild(parentElem, currentChild);
  }
  walkState.walkEndedReason = WalkEndedReasons.noMoreChildren;
}

/**
 * @typedef {SomeElement|Promise<SomeElement>} ElemOrPromiseElem
 */

/**
 * @typedef {boolean|Promise<boolean>} BoolOrPromiseBool
 */

/**
 * @typedef {Object} WalkChildrenOfCustomOpts
 * @property {SomeElement} parentElement - The element who's children are to
 * be visited, if not supplied it is expected that a setup function is
 * @property {function(parent: SomeElement, child: SomeElement): ElemOrPromiseElem} [nextChild] - Function used to get the next child to be visited
 * @property {function(child: SomeElement): Element} [selector] - Function used to select a more specific element to be used
 * @property {function(child: SomeElement): BoolOrPromiseBool} [filter] - Function used to determine if a specific child is to be handled
 * @property {function(parent: SomeElement, child: SomeElement): BoolOrPromiseBool} [shouldWait] -
 * Function used to determine if a wait for additional children should be done
 * @property {function(parent: SomeElement, child: SomeElement): Promise<*>} [wait] - Function used
 * to perform the wait for additional children
 * @property {boolean} [loader = false] - Should the walk expect that the parent element
 * could have additional child elements added e.g. infinite loading.
 * If loader is falsy and either or both shouldWait and wait function(s) are supplied then the walk
 * behaves as if the loader was set to true
 * @property {WaitForOptions} [waitOptions] - Options controlling
 * the wait for more children {@link waitForAdditionalElemChildren} when no custom
 * wait function is supplied
 */

/**
 * @typedef {Object} TraversalOpts
 * @property {function(element: SomeElement, additionalArgs: *): *} handler - The function to be called for each child
 * @property {?SomeElement} [parentElement] - The element who's children are to
 * be visited, if not supplied it is expected that a setup function is
 * @property {function(): ElemOrPromiseElem} [setup] - Function
 * used to receive the parent element who's children are to be traversed.
 * @property {function(): *} [setupFailure] - Function called if the supplied
 * setup function fails to return a parent element or the supplied parent
 * element is falsy
 * @property {function(parent: SomeElement, child: SomeElement): ElemOrPromiseElem} [nextChild] - Function used to get the
 * next child to be visited
 * @property {function(child: SomeElement): BoolOrPromiseBool} [filter] -
 * Function used to determine if a specific child is to be handled
 * or not, returning true indicates the child element is to be handled false otherwise
 * @property {function(child: SomeElement): Element} [selector] - Function
 * used to select a more specific element to be used
 * @property {function(parent: SomeElement, child: SomeElement): BoolOrPromiseBool} [shouldWait] -
 * Function used to determine if a wait for additional children should be done
 * @property {function(parent: SomeElement, child: SomeElement): Promise<*>} [wait] - Function used
 * to perform the wait for additional children
 * @property {function(): *} [preTraversal] - Function used to perform
 * some action before traversal begins. If this function returns an (async) generator
 * the values of the generator are yielded otherwise no value this function returns
 * is yielded
 * @property {function(setupFailure: boolean): *} [postTraversal] - Function called after the traversal
 * is complete with T/F indicating if the function is being called if setup failed or the traversal is complete.
 * The value of this function yield'd if it is truthy
 * @property {*} [additionalArgs] - Optional additional arguments to be supplied
 * to the handler function
 * @property {boolean} [loader = false] - Should the traversal expect that the parent element
 * could have additional child elements added e.g. infinite loading.
 * If loader is falsy and either or both shouldWait and wait function(s) are supplied then the walk
 * behaves as if the loader was set to true
 * @property {WaitForOptions} [waitOptions] - Options controlling
 * the wait for more children
 */

/**
 * @typedef {Object} DisconnectingWalkState
 * @property {number} walkEndedReason - The {@link WalkEndedReasons} why the walk ended (set once the walk has ended)
 * @property {function(): SomeElement} findParentElement - function used to find the parent element
 * @property {function(parent: SomeElement, child: SomeElement): SomeElement} refindCurrentChild - function used to re-find the currnet child when the parent element has become disconnected
 * @property {function(parent: SomeElement, child: SomeElement): boolean} shouldWait - function used to determine if the wait function should be called
 * @property {function(parent: SomeElement, child: SomeElement): boolean} wait - function used to wait once `shouldWait` returns true
 * @property {function(parent: SomeElement, child: SomeElement): SomeElement} nextChild - function used to get the next child element
 */
