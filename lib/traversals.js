import { waitForAdditionalElemChildren } from './delays';
import { getElemSiblingAndRemoveElem } from './dom';
import { isGenerator, isPromise } from './general';

/**
 *
 * @param {Element} parentElement
 * @param {function(element: Element, additionalArgs: *): *} fn
 * @param {*} [additionalArgs]
 * @return {AsyncIterableIterator<*>}
 */
export async function* traverseChildrenOfLoaderParent(
  parentElement,
  fn,
  additionalArgs
) {
  if (parentElement == null) return;
  let nextChild = parentElement.firstElementChild;
  let nextValue;
  while (nextChild != null) {
    nextValue = fn(nextChild, additionalArgs);
    if (isGenerator(nextValue)) yield* nextValue;
    else yield nextValue;
    if (nextChild.nextElementSibling == null) {
      await waitForAdditionalElemChildren(
        parentElement,
        parentElement.childElementCount
      );
    }
    nextChild = nextChild.nextElementSibling;
  }
}

/**
 *
 * @param {Element} parentElement
 * @param {function(element: Element, additionalArgs: *): *} fn
 * @param {*} [additionalArgs]
 * @return {AsyncIterableIterator<*>}
 */
export async function* traverseChildrenOfLoaderParentRemovingPrevious(
  parentElement,
  fn,
  additionalArgs
) {
  if (parentElement == null) return;
  let nextChild = parentElement.firstElementChild;
  let nextValue;
  while (nextChild != null) {
    nextValue = fn(nextChild, additionalArgs);
    if (isGenerator(nextValue)) yield* nextValue;
    else yield nextValue;
    if (nextChild.nextElementSibling == null) {
      await waitForAdditionalElemChildren(
        parentElement,
        parentElement.childElementCount
      );
    }
    nextChild = getElemSiblingAndRemoveElem(nextChild);
  }
}

/**
 *
 * @param {Element} parentElement
 * @param {function(element: Element, additionalArgs: *): *} fn
 * @param {*} [additionalArgs]
 * @return {AsyncIterableIterator<*>}
 */
export async function* traverseChildrenOf(parentElement, fn, additionalArgs) {
  if (parentElement == null) return;
  let nextChild = parentElement.firstElementChild;
  let nextValue;
  while (nextChild != null) {
    nextValue = fn(nextChild, additionalArgs);
    if (isGenerator(nextValue)) yield* nextValue;
    else yield nextValue;
    nextChild = nextChild.nextElementSibling;
  }
}

/**
 *
 * @param {Element} parentElement
 * @param {function(element: Element, additionalArgs: *): *} fn
 * @param {*} [additionalArgs]
 * @return {AsyncIterableIterator<*>}
 */
export async function* traverseChildrenOfRemovingPrevious(
  parentElement,
  fn,
  additionalArgs
) {
  if (parentElement == null) return;
  let nextChild = parentElement.firstElementChild;
  let nextValue;
  while (nextChild != null) {
    nextValue = fn(nextChild, additionalArgs);
    if (isGenerator(nextValue)) yield* nextValue;
    else yield nextValue;
    nextChild = getElemSiblingAndRemoveElem(nextChild);
  }
}

export async function* traverseChildrenOfLoaderParentGenFn(
  parentElement,
  fn,
  genFn,
  additionalArgs
) {
  if (parentElement == null) return;
  let nextChild = parentElement.firstElementChild;
  let nextValue;
  while (nextChild != null) {
    nextValue = fn(nextChild, additionalArgs);
    if (isGenerator(nextValue)) yield* nextValue;
    else yield nextValue;
    if (nextChild.nextElementSibling == null && (await genFn())) {
      await waitForAdditionalElemChildren(
        parentElement,
        parentElement.childElementCount
      );
    }
    nextChild = nextChild.nextElementSibling;
  }
}

/**
 * @typedef {Object} TraversalOpts
 * @property {function(element: Element, additionalArgs: *): *} handler -
 * The function to be called for each child
 * @property {?Element} [parentElement] - The element who's children are to
 * be visited, if not supplied it is expected that a setup function is
 * @property {function(): (Element|Promise<Element>)} [setup] - Function
 * used to receive the parent element who's children are to be traversed.
 * @property {function(): *} [setupFailure] - Function called if the supplied
 * setup function fails to return a parent element or the supplied parent
 * element is falsy
 * @property {function(parent: Element, child: Element): (Element|Promise<Element>)} [nextChild] - Function used to get the
 * next child to be visited
 * @property {function(child: Element): (boolean|Promise<boolean>)} [filter] -
 * Function used to determine if a specific child is to be handled
 * or not, returning true indicates the child element is to be handled false otherwise
 * @property {function(child: Element): Element} [selector] - Function
 * used to select a more specific element to be used
 * @property {function(parent: Element, child: Element): (boolean|Promise<boolean>)} [shouldWait] -
 * Function used to determine if a wait for additional children should be done
 * @property {function(parent: Element, child: Element): Promise<*>} [wait] - Function used
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
 * @property {boolean} [loader = false] - Should the traversal expect
 * that the parent element could have additional child elements added?
 * e.g. infinite loading
 * @property {WaitForOptions} [waitOptions] - Options controlling
 * the wait for more children
 */

/**
 * Traverses the children of the supplied element applying the
 * supplied function to each child.
 * @param {TraversalOpts} opts
 * @return {AsyncIterableIterator<*>}
 */
export async function* traverseChildrenOfCustom(opts) {
  if (!opts) return;
  const {
    handler,
    additionalArgs,
    waitOptions,
    selector,
    filter,
    shouldWait = (parent, child) => child.nextElementSibling == null,
    nextChild = (parent, child) => child.nextElementSibling,
    wait = (parent, child) =>
      waitForAdditionalElemChildren(
        parent,
        parent.childElementCount,
        waitOptions
      ),
    loader = false,
  } = opts;
  if (typeof opts.preTraversal === 'function') {
    const preValue = opts.preTraversal();
    if (isGenerator(preValue)) yield* preValue;
    else if (isPromise(preValue)) await preValue;
  }
  let parentElement;
  if (typeof opts.setup === 'function') {
    const parentElemOrPromise = opts.setup();
    parentElement = isPromise(parentElemOrPromise)
      ? await parentElemOrPromise
      : parentElemOrPromise;
  } else {
    parentElement = opts.parentElement;
  }
  if (!parentElement) {
    if (opts.setupFailure) {
      const handlingFailure =
        typeof opts.setupFailure === 'function'
          ? opts.setupFailure()
          : opts.setupFailure;
      if (isGenerator(handlingFailure)) yield* handlingFailure;
      else yield handlingFailure;
    }
    if (typeof opts.postTraversal === 'function') {
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
  let curChild = parentElement.firstElementChild;
  let useChild;
  let nextValue;
  let nextChildValue;
  let shouldWaitValue;
  while (curChild != null) {
    useChild = filter ? filter(curChild) : true;
    if (isPromise(useChild) ? await useChild : useChild) {
      nextValue = handler(
        selector ? selector(curChild) : curChild,
        additionalArgs
      );
      if (isGenerator(nextValue)) {
        try {
          let next;
          let nv;
          while (true) {
            next = nextValue.next();
            nv = isPromise(next) ? await next : next;
            if (nv.done) {
              if (nv.value) yield nv.value;
              break;
            } else {
              yield nv.value;
            }
          }
        } catch (e) {}
      } else if (nextValue) {
        yield nextValue;
      }
    }
    if (loader) {
      shouldWaitValue = shouldWait(parentElement, curChild);
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
  if (typeof opts.postTraversal === 'function') {
    const postValue = opts.postTraversal(false);
    if (isGenerator(postValue)) {
      try {
        let next;
        let nv;
        while (true) {
          next = postValue.next();
          nv = isPromise(next) ? await next : next;
          if (nv.done) {
            return nv.value;
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
