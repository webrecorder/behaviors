import { waitForAdditionalElemChildren } from './delays';
import { getElemSiblingAndRemoveElem, childElementIterator } from './dom';
import {
  isGenerator,
  isPromise,
  isFunction,
  noExceptGeneratorWrap,
  autobind,
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
              if (nv.value) return nv.value;
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
 * Reasons why the walk performed by {@link DisconnectingWalk} has ended
 * @type {{failedToRefindParent: number, noMoreChildren: number, failedToRefindChild: number, failedToFindFirstParent: number, failedToFindFirstChild: number}}
 */
export const WalkEndedReasons = {
  failedToFindFirstParent: 1,
  failedToFindFirstChild: 2,
  failedToRefindParent: 3,
  failedToRefindChild: 4,
  noMoreChildren: 0,
};

export class DisconnectingWalk {
  /**
   *
   * @param {DisconnectingWalkConfig} config
   */
  constructor(config) {
    config.loader = !!config.loader;
    // if is loader is not set to true but a custom shouldWait or wait
    // function was supplied, then it is assumed that loader should be true
    if (
      !config.loader &&
      (isFunction(config.shouldWait) || isFunction(config.wait))
    ) {
      config.loader = true;
    }
    // check if we need to use default functions
    if (config.loader && !isFunction(config.shouldWait)) {
      config.shouldWait = (parent, child) => child.nextElementSibling == null;
    }
    if (config.loader && !isFunction(config.wait)) {
      config.wait = (parent, child) =>
        waitForAdditionalElemChildren(parent, config.waitOptions);
    }
    if (!isFunction(config.nextChild)) {
      config.nextChild = (parent, child) => child.nextElementSibling;
    }

    /**
     * @type {DisconnectingWalkConfig}
     */
    this.opts = config;

    /**
     * Set to one of the {@link WalkEndedReasons} when a walk is ended
     * @type {?number}
     */
    this.walkEndedReason = null;
    // perform the initial setup and set the walk end reason if setup fails
    const parent = this.opts.findParent();
    let child;
    if (!parent) {
      this.walkEndedReason = WalkEndedReasons.failedToFindFirstParent;
    } else {
      child = parent.firstElementChild;
      if (!child) {
        this.walkEndedReason = WalkEndedReasons.failedToFindFirstChild;
      }
    }

    /**
     * The parent element containing the children to be walked
     * @type {?SomeElement}
     */
    this._curParent = parent;

    /**
     * The current child element of the walk
     * @type {?SomeElement}
     */
    this._curChild = child;
    autobind(this);
  }

  /**
   * Returns the parent element who's children are being walked.
   * The element returned maybe disconnected
   * @return {?SomeElement}
   */
  get parent() {
    return this._curParent;
  }

  /**
   * Returns the current child.
   * The element returned maybe disconnected
   * @return {?SomeElement}
   */
  get child() {
    return this._curChild;
  }

  /**
   * Swap the current child element, the yielded element, of the walk to the supplied element.
   *
   * This function should be used in the cases when the child element yield'd
   * is removed or will be removed from the document and never replaced after
   * performing some action.
   *
   * In that case when before performing the action that would remove the yield'd child,
   * the child's previous element sibling should be supplied to this method in order
   * to ensure that the walk continues as expected.
   *
   * @param {SomeElement} newChild - The element to replace the current child element
   */
  swapChild(newChild) {
    this._curChild = newChild;
  }

  /**
   * Initiate re-finding the parent and or current child element of the walk,
   * returning true to indicate success (elements re-found or no need to re-found)
   * and false if the parent or current child element could not be re-found.
   *
   * The parent and or child elements are re-found if it is detected that they
   * have been removed from the document
   *
   * @return {boolean}
   */
  refind() {
    if (!this._curParent || !this._curParent.isConnected) {
      this._curParent = this.opts.findParent();
      if (!this._curParent) {
        this.walkEndedReason = WalkEndedReasons.failedToRefindParent;
        return false;
      }
      this._curChild = this.opts.refindChild(this._curParent, this._curChild);
      if (!this._curChild) {
        this.walkEndedReason = WalkEndedReasons.failedToRefindChild;
        return false;
      }
    }
    if (!this._curChild || !this._curChild.isConnected) {
      this._curChild = this.opts.refindChild(this._curParent, this._curChild);
      if (!this._curChild) {
        this.walkEndedReason = WalkEndedReasons.failedToRefindChild;
        return false;
      }
    }
    return true;
  }

  /**
   * Perform the walk.
   * @return {AsyncIterableIterator<SomeElement>}
   */
  async *walk() {
    if (this.walkEndedReason) return;
    while (this._curChild != null && this._curChild.isConnected) {
      yield this._curChild;
      if (!this.refind()) break;
      if (
        this.opts.loader &&
        this.opts.shouldWait(this._curParent, this._curChild)
      ) {
        await this.opts.wait(this._curParent, this._curChild);
      }
      this._curChild = this.opts.nextChild(this._curParent, this._curChild);
    }
    if (!this.walkEndedReason) {
      this.walkEndedReason = WalkEndedReasons.noMoreChildren;
    }
  }

  /**
   * Same as {@link walk}
   * @return {AsyncIterableIterator<SomeElement>}
   */
  [Symbol.asyncIterator]() {
    return this.walk();
  }
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
 * the wait for more children {@link waitForAdditionalElemChildren} when no custom
 * wait function is supplied
 */

/**
 * @typedef {Object} DisconnectingWalkConfig
 * @property {function(): ?SomeElement} findParent - function used to find the parent element
 * @property {function(parent: SomeElement, child: SomeElement): ?SomeElement} refindChild - function used to re-find the current child when the parent element has become disconnected
 * @property {function(parent: SomeElement, child: SomeElement): ?SomeElement} [nextChild] - function used to get the next child element
 * @property {boolean}  [loader = false] - Should the traversal expect that the parent element
 * could have additional child elements added e.g. infinite loading. When true the shouldWait and wait functions must be supplied
 * @property {function(parent: SomeElement, child: SomeElement): boolean} [shouldWait] - function used to determine if the wait function should be called. Only required when loader is true
 * @property {function(parent: SomeElement, child: SomeElement): void} [wait] - function used to wait once `shouldWait` returns true. Only required when loader is true
 * @property {WaitForOptions} [waitOptions] - Options controlling
 * the wait for more children {@link waitForAdditionalElemChildren} when no custom
 * wait function is supplied
 */
