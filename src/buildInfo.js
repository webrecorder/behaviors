if (process.env.DOCKER) module.paths.unshift('/build/node_modules');
const path = require('path');
const fs = require('fs-extra');
const prettier = require('prettier');
const prettierOpts = { singleQuote: true, parser: 'babylon' };

const noWrapperFiles = new Set(['collectOutlinks.js', 'autoscroll.js']);
const behaviorDir = path.join(__dirname, 'behaviors');

const makePretty = code => prettier.format(code, prettierOpts);

const debugMode = true;

const SHOW_DEBUG = process.env.SHOW_DEBUG != null || debugMode;

const outro = `})($x, ${SHOW_DEBUG});`;

const wrappers = {
  setup: {
    intro: '(function runner(xpg, debug) { ',
    renderChunk: makePretty,
    outro,
    name: 'wr-behavior-wrapper-setup',
  },
  runAwaitable: {
    intro: '(function runner(xpg, debug) { ',
    renderChunk(code) {
      return makePretty(code.replace('/*!return!*/', 'return'));
    },
    outro,
    name: 'wr-behavior-wrapper-async-run',
  },
  none: {
    intro: '',
    renderChunk: makePretty,
    footer: '',
    name: 'wr-behavior-wrapper-none',
  }
};

/**
 *
 * @param {function(file: str, baseConfig: Object): Object} configCustomizer
 * @return {Object[]}
 */
function createBehaviorConfigs(configCustomizer) {
  return fs.readdirSync(behaviorDir).map(file => {
    const config = {
      input: path.join(behaviorDir, file),
      output: {
        sourcemap: false,
        format: 'es',
        exports: 'none',
      },
      plugins: []
    };
    switch (file) {
      case 'autoscroll.js':
        config.plugins.push(wrappers.runAwaitable);
        break;
      case 'collectOutlinks.js':
        config.plugins.push(wrappers.none);
        break;
      default:
        config.plugins.push(wrappers.setup);
        break;
    }
    return configCustomizer(file, config);
  });
}

module.exports = {
  noWrapperFiles,
  createBehaviorConfigs,
  behaviorDir,
  wrappers
};
