if (process.env.DOCKER && module.paths.indexOf('/build/node_modules') === -1)
  module.paths.unshift('/build/node_modules');
const nodeResolve = require('rollup-plugin-node-resolve');
const cleanup = require('rollup-plugin-cleanup');
const path = require('path');
const fs = require('fs-extra');
const prettier = require('prettier');
const { prettierOpts } = require('./defaultOpts');
const { buildDir } = require('./paths');

const noWrapperFiles = new Set(['collectOutlinks.js', 'autoscroll.js']);

const makePretty = code => prettier.format(code, prettierOpts);

const debugMode = true;

const SHOW_DEBUG = process.env.SHOW_DEBUG != null || debugMode;

const outro = `})($x, ${SHOW_DEBUG});`;

const wrappers = {
  setup: {
    intro: '(function runner(xpg, debug) { ',
    renderChunk: makePretty,
    outro,
    name: 'wr-behavior-wrapper-setup'
  },
  runAwaitable: {
    intro: '(function runner(xpg, debug) { ',
    renderChunk(code) {
      return makePretty(code.replace('/*!return!*/', 'return'));
    },
    outro,
    name: 'wr-behavior-wrapper-async-run'
  },
  none: {
    intro: '',
    renderChunk: makePretty,
    footer: '',
    name: 'wr-behavior-wrapper-none'
  }
};

/**
 *
 * @param {function(file: str, baseConfig: Object): Object} configCustomizer
 * @return {Object[]}
 */
function createBehaviorConfigs(configCustomizer) {
  return fs.readdirSync(buildDir).map(file => {
    const config = {
      input: path.join(buildDir, path.basename(file, '.js')),
      output: {
        sourcemap: false,
        format: 'es',
        exports: 'none'
      },
      plugins: [nodeResolve(), cleanup(), wrappers.setup]
    };
    return configCustomizer(file, config);
  });
}

async function makeInputOutputConfigs({ buildDirPath, distPath }) {
  const inOut = [];
  const buildDirFiles = await fs.readdir(buildDirPath);
  let i = buildDirFiles.length;
  let buildDirFile, inConf, outConf;
  while (i--) {
    buildDirFile = buildDirFiles[i];
    inConf = {
      input: path.join(buildDirPath, buildDirFile),
      plugins: [nodeResolve(), cleanup(), wrappers.setup]
    };
    inOut.push({
      in: inConf,
      out: {}
    });
  }
  return inOut;
}

function makeInputOutputConfig(inFile, outFile) {
  const inConf = {
    input: inFile,
    plugins: [nodeResolve(), cleanup(), wrappers.setup]
  };
  const outConf = {
    file: outFile,
    sourcemap: false,
    format: 'es',
    exports: 'none'
  };
  return { inConf, outConf };
}

module.exports = {
  makeInputOutputConfig,
  makeInputOutputConfigs,
  noWrapperFiles,
  createBehaviorConfigs,
  buildDir,
  wrappers
};
