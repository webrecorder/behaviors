const path = require('path');
const fs = require('fs-extra');
const behaviorWrapper = require('./behavior-wrapper-plugin');

const noWrapperFiles = new Set(['autoscroll.js', 'collectOutlinks.js']);
const behaviorDir = path.join(__dirname, 'behaviors');
const wrapperConfig = behaviorWrapper({ noWrapperFiles });

/**
 *
 * @param {function(file: str, baseConfig: Object): Object} configCustomizer
 * @return {Object[]}
 */
function createBehaviorConfigs(configCustomizer) {
  return fs.readdirSync(behaviorDir).map(file =>
    configCustomizer(file, {
      input: path.join(behaviorDir, file),
      output: {
        sourcemap: false,
        format: 'es',
        exports: 'none'
      },
      plugins: [wrapperConfig]
    })
  );
}

module.exports = {
  noWrapperFiles,
  createBehaviorConfigs
};
