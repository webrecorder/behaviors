const prettier = require('prettier');

const prettierOpts = { singleQuote: true, parser: 'babylon' };

function makeWrapper(code) {
  return prettier.format(
    `(function runner(xpg, debug = false) { 
${code} 
})($x);`,
    prettierOpts
  );
}

/**
 * @param {{noWrapperFiles: Set<string>, defaultWrapperFN: function(code: string): string, customWrappers: Map<string, function(code: string): string>}} opts
 * @return {Object}
 */
module.exports = function wrapperPlugin(opts) {
  return {
    intro: '(function runner(xpg, debug) { ',
    outro: '})($x, false);',
    name: 'wr-behavior-wrapper',
    renderChunk(code, options, outputOpts) {
      if (opts.noWrapperFiles.has(options.fileName)) {
        return code;
      }
      if (opts.customWrappers.has(options.fileName)) {
        return opts.customWrappers.get(options.fileName)(code);
      }
      return opts.defaultWrapperFN(code);
    }
  };
};
