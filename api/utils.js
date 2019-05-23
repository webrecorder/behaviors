exports.autobind = function autobind(clazz) {
  const clazzProps = Object.getOwnPropertyNames(clazz.constructor.prototype);
  let prop;
  let propValue;
  for (let i = 0; i < clazzProps.length; i++) {
    prop = clazzProps[i];
    propValue = clazz[prop];
    if (prop !== 'constructor' && typeof propValue === 'function') {
      clazz[prop] = propValue.bind(clazz);
    }
  }
};
