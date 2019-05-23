/**
 * @type {{bad: symbol, fileNotModule: symbol, noDefaultExport: symbol, good: symbol, notChecked: symbol}}
 */
exports.CheckState = {
  good: Symbol('good'),
  bad: Symbol('bad'),
  fileNotModule: Symbol('not-a-module'),
  noDefaultExport: Symbol('no-default-export'),
  notChecked: Symbol('not-checked'),
};

/**
 *
 * @type {{function: symbol, value: symbol}}
 */
exports.ExportDefaultType = {
  function: Symbol('function'),
  value: Symbol('value'),
};
