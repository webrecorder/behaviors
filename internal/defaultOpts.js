exports.prettierOpts = { singleQuote: true, parser: 'babel' };

exports.BParseOptions = {
  sourceType: 'module',
  plugins: [
    'asyncGenerators',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'objectRestSpread'
  ]
};