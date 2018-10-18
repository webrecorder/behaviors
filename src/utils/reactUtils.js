export default class ReactUtils {
  /**
   * @return {HTMLElement}
   */
  static getReactRootHostElem() {
    return document.getElementById(ReactUtils.reactProps.rootHostElemId);
  }

  /**
   * @param {HTMLElement | Element | Node} elem
   * @return {Object}
   */
  static getInternalRootOnElem(elem) {
    return elem[ReactUtils.reactProps.internalRoot];
  }

  /**
   * @param {HTMLElement | Element | Node} elem
   * @return {Object}
   */
  static reactInstanceFromDOMElem(elem) {
    const keys = Object.keys(elem);
    let i = 0;
    let len = keys.length;
    let internalKey;
    for(; i < len; ++i) {
      if (keys[i].startsWith(ReactUtils.reactProps.onDomNode)) {
        internalKey = keys[i];
        break;
      }
    }
    if (!internalKey) throw new Error('Could not find react internal key');
    return elem[internalKey];
  }

  /**
   * @param {Node[]} elems
   * @param {function(key: string): boolean} selectingFn
   * @return {Array<{node: HTMLElement | Element | Node, reactInstance: Object}>}
   */
  static getElemReactInstances(elems, selectingFn) {
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
  static findChildWithKey(reactInstance, key) {
    let child = reactInstance.child;
    while (child) {
      if (child.key && child.key === key) {
        return child;
      }
      child = child.child;
    }
    return undefined;
  }
}

ReactUtils.reactProps = {
  rootContainer: '_reactRootContainer',
  internalRoot: '_internalRoot',
  onDomNode: '__reactInternalInstance',
  rootHostElemId: 'react-root'
};
