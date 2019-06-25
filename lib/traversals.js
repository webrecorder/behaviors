import { waitForAdditionalElemChildren } from './delays';
import { getElemSibling, getElemSiblingAndRemoveElem } from './dom';
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
 * @property {Element} parentElement - The element who's children are to
 * be visited
 * @property {function(element: Element, additionalArgs: *): *} handler -
 * The function to be called for each child
 * @property {*} [additionalArgs] - Optional additional arguments to be supplied
 * to the handler function
 * @property {function(element: Element): (boolean|Promise<boolean>)} [filter] -
 * Function used to determine if a specific child is to be handled
 * or not, returning true indicates the child element is to be handled false otherwise
 * @property {function(element: Element): Element} [selector] - Function
 * used to select a more specific element to be used
 * @property {function(): (boolean|Promise<boolean>)} [generator] - Function
 * used to generate more children if there are no more
 * @property {boolean} [removePrevious = false] - Should the previous
 * child handled be removed
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
  if (!opts || opts.parentElement == null) return;
  const {
    parentElement,
    handler,
    additionalArgs,
    generator,
    selector = arg => arg,
    filter = () => true,
    removePrevious = false,
    loader = false,
    waitOptions
  } = opts;
  const nextChildFn = removePrevious
    ? getElemSiblingAndRemoveElem
    : getElemSibling;
  const shouldWaitForMoreKids = loader || generator != null;
  let nextChild = parentElement.firstElementChild;
  let nextValue;
  let useChild;
  while (nextChild != null) {
    useChild = filter(nextChild);
    if (isPromise(useChild) ? await useChild : useChild) {
      nextValue = handler(selector(nextChild), additionalArgs);
      if (isGenerator(nextValue)) yield* nextValue;
      else yield nextValue;
    }
    if (nextChild.nextElementSibling == null && shouldWaitForMoreKids) {
      let doWait = true;
      if (generator != null) {
        const genRet = generator();
        if (isPromise(genRet)) doWait = await genRet;
        else doWait = genRet;
      }
      if (doWait) {
        await waitForAdditionalElemChildren(
          parentElement,
          parentElement.childElementCount,
          waitOptions
        );
      }
    }
    nextChild = nextChildFn(nextChild);
  }
}
