import { waitForAdditionalElemChildren } from './delays';
import { getElemSiblingAndRemoveElem } from './dom';

/**
 *
 * @param {Element} parentElement
 * @param {function(element: Element, additionalArgs: *): AsyncIterableIterator<*>} fn
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
  while (nextChild != null) {
    yield* fn(nextChild, additionalArgs);
    if (nextChild.nextElementSibling == null) {
      await waitForAdditionalElemChildren(
        parentElement,
        parentElement.children.length
      );
    }
    nextChild = nextChild.nextElementSibling;
  }
}

/**
 *
 * @param {Element} parentElement
 * @param {function(element: Element, additionalArgs: *): AsyncIterableIterator<*>} fn
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
  while (nextChild != null) {
    yield* fn(nextChild, additionalArgs);
    if (nextChild.nextElementSibling == null) {
      await waitForAdditionalElemChildren(
        parentElement,
        parentElement.children.length
      );
    }
    nextChild = getElemSiblingAndRemoveElem(nextChild);
  }
}

/**
 *
 * @param {Element} parentElement
 * @param {function(element: Element, additionalArgs: *): AsyncIterableIterator<*>} fn
 * @param {*} [additionalArgs]
 * @return {AsyncIterableIterator<*>}
 */
export async function* traverseChildrenOf(parentElement, fn, additionalArgs) {
  if (parentElement == null) return;
  let nextChild = parentElement.firstElementChild;
  while (nextChild != null) {
    yield* fn(nextChild, additionalArgs);
    nextChild = nextChild.nextElementSibling;
  }
}

/**
 *
 * @param {Element} parentElement
 * @param {function(element: Element, additionalArgs: *): AsyncIterableIterator<*>} fn
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
  while (nextChild != null) {
    yield* fn(nextChild, additionalArgs);
    nextChild = getElemSiblingAndRemoveElem(nextChild);
  }
}
