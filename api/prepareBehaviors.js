'use strict';
const cp = require('child_process');
const {
  behaviorCLIPath,
  defaultBehaviorConfigPath,
  rootDir,
} = require('../internal/paths');

const spawnArgs = ['-c', defaultBehaviorConfigPath, '-b'];

/**
 * Builds the behaviors if the behavior API server config indicates to do so,
 * returning a Promise that resolves once the behaviors have been built otherwise resolves immediately.
 * @param {Object} config - The behavior API server config
 * @return {Promise<any>}
 */
module.exports = function prepareBehaviors(config) {
  return new Promise((resolve, reject) => {
    if (!config.behaviorInfo.build) return resolve();
    console.log('Building behaviors');
    console.log();
    const cliProcess = cp.fork(behaviorCLIPath, spawnArgs, {
      cwd: rootDir,
      env: process.env,
      stdio: 'inherit',
    });

    cliProcess.on('error', err => {
      console.error(
        'Preparing the behaviors failed: failed to start spawn the behavior cli process'
      );
      reject(err);
    });

    cliProcess.on('close', code => {
      if (code !== 0) {
        return reject(
          new Error(
            `Preparing the behaviors failed: the behavior cli process exited with code ${code}`
          )
        );
      }
      resolve();
    });
  });
};
