import { waitForAdditionalElemChildren } from './delays';
import { getElemSiblingAndRemoveElem } from './dom';
import { isGenerator } from './general';

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
