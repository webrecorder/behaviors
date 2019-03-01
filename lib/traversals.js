import { waitForAdditionalElemChildren } from './delays';

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
  let nextIterator;
  let next;
  let nextChild = parentElement.firstElementChild;
  while (nextChild != null) {
    nextIterator = fn(nextChild, additionalArgs);
    next = await nextIterator.next();
    while (!next.done) {
      yield next.value;
      next = await nextIterator.next();
    }
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
export async function* traverseChildrenOf(parentElement, fn, additionalArgs) {
  if (parentElement == null) return;
  let nextIterator;
  let next;
  let nextChild = parentElement.firstElementChild;
  while (nextChild != null) {
    nextIterator = fn(nextChild, additionalArgs);
    next = await nextIterator.next();
    while (!next.done) {
      yield next.value;
      next = await nextIterator.next();
    }
    nextChild = nextChild.nextElementSibling;
  }
}
