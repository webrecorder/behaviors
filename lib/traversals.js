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
 * @typedef {Object} TraversalOpts
 * @property {Element} parentElement
 * @property {function(element: Element, additionalArgs: *): *} handler
 * @property {*} [additionalArgs]
 * @property {function(element: Element): (boolean|Promise<boolean>)} [filter]
 * @property {function(element: Element): Element} [selector]
 * @property {function(): (boolean|Promise<boolean>)} [generator]
 * @property {boolean} [removePrevious = false]
 * @property {boolean} [loader = false]
 * @property {WaitForOptions} [waitOptions]
 */


/**
 *
 * @param {TraversalOpts} opts
 * @return {AsyncIterableIterator<*>}
 */
export async function* traverseChildrenOf2(opts) {
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
