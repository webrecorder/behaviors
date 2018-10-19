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
 * @param {{noWrapperFiles: Set<string>}} [opts = {noWrapperFiles: Set<string>}]
 * @return {Object}
 */
module.exports = function wrapperPlugin(opts = { noWrapperFiles: new Set() }) {
  return {
    name: 'wr-behavior-wrapper',
    renderChunk(code, options, outputOpts) {
      if (opts.noWrapperFiles.has(options.fileName)) {
        return code;
      }
      return makeWrapper(code);
    }
  };
};
