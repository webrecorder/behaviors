/** @ignore */
const __ReactProps = {
  rootContainer: '_reactRootContainer',
  internalRoot: '_internalRoot',
  onDomNode: '__reactInternalInstance',
  rootHostElemId: 'react-root',
  mProps: 'memoizedProps',
};

/**
 * Returns the root host element of an react application (id = react-root)
 * @param {string} [alternativeId] - An alternative id to use rather than the default
 * @return {?HTMLElement}
 */
export function getReactRootHostElem(alternativeId) {
  return document.getElementById(
    alternativeId != null ? alternativeId : __ReactProps.rootHostElemId
  );
}

/**
 * Returns the internal root object added by react on the supplied element.
 * Property `_internalRoot`
 * @param {HTMLElement|Element|Node} elem
 * @return {Object}
 */
export function getInternalRootOnElem(elem) {
  return elem[__ReactProps.internalRoot];
}

/**
 * Returns the root container object added by react
 * @param {HTMLElement|Element|Node} elem
 * @return {?Object}
 */
export function getReactRootContainer(elem) {
  if (!elem) return null;
  const hostContainer = elem[__ReactProps.rootContainer];
  if (hostContainer) {
    return hostContainer[__ReactProps.internalRoot];
  }
  return null;
}

/**
 * Returns the react instance object that lives on the live element
 * @param {HTMLElement|Element|Node} elem - The element to have its
 * react instance extracted from
 * @return {?Object}
 */
export function reactInstanceFromDOMElem(elem) {
  const keys = Object.keys(elem);
  let len = keys.length;
  let internalKey;
  for (var i = 0; i < len; ++i) {
    if (keys[i].startsWith(__ReactProps.onDomNode)) {
      internalKey = keys[i];
      break;
    }
  }
  if (!internalKey) return null;
  return elem[internalKey];
}

/**
 * Returns a function for retrieving the react instance associated with
 * the supplied element. Unlike {@link reactInstanceFromDOMElem} the returned
 * function discovers how react is embedding itself on the element once
 * and uses the discovered information for every other element.
 * @return {function(elem: SomeElement): ?Object}
 */
export function makeReactInstanceFromDOMElemFun() {
  let memoizedInstanceKey;
  const whichKey = key => key.startsWith('__reactInternalInstance');
  const findKey = elem => Object.keys(elem).find(whichKey);
  return function reactInstanceFromDOMElem(elem) {
    if (!elem) return null;
    if (memoizedInstanceKey == null) {
      memoizedInstanceKey = findKey(elem);
      if (memoizedInstanceKey == null) return null;
    }
    if (elem[memoizedInstanceKey]) return elem[memoizedInstanceKey];
    const maybeNewKey = findKey(elem);
    if (maybeNewKey && elem[maybeNewKey]) {
      memoizedInstanceKey = maybeNewKey;
      return elem[maybeNewKey];
    }
    return null;
  };
}

/**
 * Converts the supplied array of elements into an array of objects
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
 * Walks the children of a react component to
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

/**
 * Attempts the find the redux store from the supplied component
 * @param {Object} startingComponent
 * @return {?Object}
 */
export function findReduxStore(startingComponent) {
  if (!startingComponent) return null;
  let component;
  const q = [startingComponent];
  while (q.length) {
    component = q.shift();
    if (component.memoizedProps && component.memoizedProps.store) {
      return component.memoizedProps.store;
    }
    if (component.child) {
      q.push(component.child);
    }
    if (component.sibling) {
      q.push(component.sibling);
    }
  }
  return null;
}
