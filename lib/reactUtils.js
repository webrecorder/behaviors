export let reactProps = {
  rootContainer: '_reactRootContainer',
  internalRoot: '_internalRoot',
  onDomNode: '__reactInternalInstance',
  rootHostElemId: 'react-root',
  mProps: 'memoizedProps'
};

/**
 * @desc Returns the root host element of an react application (id = react-root)
 * @param {string} [alternativeId] - An alternative id to use rather than the default
 * @return {?HTMLElement}
 */
export function getReactRootHostElem(alternativeId) {
  const id = alternativeId != null ? alternativeId : reactProps.rootHostElemId;
  return document.getElementById(id);
}

/**
 * @desc Returns the internal root object added by react on the supplied element.
 * Property `_internalRoot`
 * @param {HTMLElement|Element|Node} elem
 * @return {Object}
 */
export function getInternalRootOnElem(elem) {
  return elem[reactProps.internalRoot];
}

/**
 * @desc Returns the root container object added by react
 * @param {HTMLElement|Element|Node} elem
 * @return {?Object}
 */
export function getReactRootContainer(elem) {
  const hostContainer = elem[reactProps.rootContainer];
  if (hostContainer) {
    return hostContainer[reactProps.internalRoot];
  }
  return null;
}

/**
 * @desc Returns the react instance object that lives on the live element
 * @param {HTMLElement|Element|Node} elem - The element to have its
 * react instance extracted from
 * @return {?Object}
 */
export function reactInstanceFromDOMElem(elem) {
  const keys = Object.keys(elem);
  let len = keys.length;
  let internalKey;
  for (var i = 0; i < len; ++i) {
    if (keys[i].startsWith(reactProps.onDomNode)) {
      internalKey = keys[i];
      break;
    }
  }
  if (!internalKey) return null;
  return elem[internalKey];
}

/**
 * @desc Converts the supplied array of elements into an array of objects
 * each with property node (the live dom element) and reactInstance (the live
 * react component). An optional selection function can be supplied that
 * receives the rendered components key and returns T/F to indicate if the
 * component and element is to be selected
 * @param {Array<Node|HTMLElement|Element>} elems - The array of elements to
 * get their react instances
 * @param {function(key: string): boolean} [selectingFn] - Optional selection
 * function that takes a components key and returns T/F indicating if the
 * component is selected
 * @return {Array<{node: HTMLElement|Element|Node, reactInstance: Object}>}
 */
export function reactInstancesFromElements(elems, selectingFn) {
  const renderedNodes = [];
  const length = elems.length;
  let node;
  let reactInstance;
  for (var i = 0; i < length; ++i) {
    node = elems[i];
    reactInstance = reactInstanceFromDOMElem(node);
    if (selectingFn && selectingFn(reactInstance.key)) {
      renderedNodes.push({ node, reactInstance });
    } else {
      renderedNodes.push({ node, reactInstance });
    }
  }
  return renderedNodes;
}

/**
 * @desc Walks the children of a react component to
 * find the one that has the supplied key
 * @param {Object} reactInstance - The react instance who's children are
 * to be descended looking for the one with key
 * @param {string} key - The key of the child to retrieve
 * @return {?Object} - The found child if found
 */
export function findChildWithKey(reactInstance, key) {
  let child = reactInstance.child;
  while (child) {
    if (child.key && child.key === key) {
      return child;
    }
    child = child.child;
  }
  return null;
}
