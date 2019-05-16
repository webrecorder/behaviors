exports.prettierOpts = {
  singleQuote: true,
  trailingComma: 'es5',
  parser: 'babel',
};

exports.BParseOptions = {
  sourceType: 'module',
  plugins: [
    'asyncGenerators',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'objectRestSpread',
  ],
};
