export let reactProps = {
  rootContainer: '_reactRootContainer',
  internalRoot: '_internalRoot',
  onDomNode: '__reactInternalInstance',
  rootHostElemId: 'react-root',
  mProps: 'memoizedProps'
};

/**
 * @param {string} [alternativeId]
 * @return {HTMLElement}
 */
export function getReactRootHostElem(alternativeId) {
  const id = alternativeId != null ? alternativeId : reactProps.rootHostElemId;
  return document.getElementById(id);
}

/**
 * @param {HTMLElement | Element | Node} elem
 * @return {Object}
 */
export function getInternalRootOnElem(elem) {
  return elem[reactProps.internalRoot];
}

/**
 * @param {HTMLElement | Element | Node} elem
 * @return {Object}
 */
export function getReactRootContainer(elem) {
  const hostContainer = elem[reactProps.rootContainer];
  if (hostContainer) {
    return hostContainer[reactProps.internalRoot];
  }
  throw new Error('cant get internal root on host contianer')
}

/**
 * @param {HTMLElement | Element | Node} elem
 * @return {Object}
 */
export function reactInstanceFromDOMElem(elem) {
  const keys = Object.keys(elem);
  let i = 0;
  let len = keys.length;
  let internalKey;
  for (; i < len; ++i) {
    if (keys[i].startsWith(reactProps.onDomNode)) {
      internalKey = keys[i];
      break;
    }
  }
  if (!internalKey) throw new Error('Could not find react internal key');
  return elem[internalKey];
}

/**
 * @param {Array<Node | HTMLElement | Element>} elems
 * @param {function(key: string): boolean} selectingFn
 * @return {Array<{node: HTMLElement | Element | Node, reactInstance: Object}>}
 */
export function reactInstancesFromElements(elems, selectingFn) {
  const renderedNodes = [];
  const length = elems.length;
  let i = 0;
  let node;
  let reactInstance;
  for (; i < length; ++i) {
    node = elems[i];
    reactInstance = reactInstanceFromDOMElem(node);
    if (selectingFn(reactInstance.key)) {
      renderedNodes.push({ node, reactInstance });
    }
  }
  return renderedNodes;
}

/**
 * @param {Object} reactInstance
 * @param {string} key
 * @return {?Object}
 */
export function findChildWithKey(reactInstance, key) {
  let child = reactInstance.child;
  while (child) {
    if (child.key && child.key === key) {
      return child;
    }
    child = child.child;
  }
  return undefined;
}

