const path = require('path');
const fs = require('fs-extra');

/**
 * @type {string}
 */
const rootDir = path.join(__dirname, '..');

/**
 * @type {string}
 */
const libDir = path.join(rootDir, 'lib');

/**
 * @type {string}
 */
const finalLibDirImportPath = '../lib';

/**
 * @type {string}
 */
const behaviorDir = path.join(rootDir, 'behaviors');

/**
 * @type {string}
 */
const buildDir = path.join(rootDir, 'build');

/**
 * @type {string}
 */
const distDir = path.join(rootDir, 'dist');

/**
 * @type {string}
 */
const tsConfigFilePath = path.join(rootDir, 'tsconfig.json');

/**
 * @type {string}
 */
const defaultBehaviorMetadataPath = path.join(distDir, 'behaviorMetadata.js');

/**
 * @type {string}
 */
const behaviorCLIPath = path.join(rootDir, 'bin', 'cli-behaviors');

/**
 * @type {string}
 */
const defaultBehaviorConfigPath = path.join(rootDir, 'behavior-config.yml');

/**
 *
 * @param {string} behaviorFilePath
 * @return {string}
 */
function makeFinalBehaviorImportPath(behaviorFilePath) {
  const baseImportP = behaviorFilePath.substring(
    behaviorFilePath.indexOf(`${path.sep}behaviors`),
    behaviorFilePath.indexOf('.js')
  );
  return `..${baseImportP}`;
}

/**
 *
 * @param {string} dirPath
 * @return {string}
 */
function directoryIndexPath(dirPath) {
  return path.join(dirPath, 'index.js');
}

/**
 *
 * @param {string} dirPath
 * @return {Promise<boolean>}
 */
function directoryIndexExists(dirPath) {
  return fs
    .stat(directoryIndexPath(dirPath))
    .then(stat => stat.isFile())
    .catch(() => false);
}

module.exports = {
  buildDir,
  behaviorDir,
  finalLibDirImportPath,
  libDir,
  rootDir,
  tsConfigFilePath,
  distDir,
  defaultBehaviorMetadataPath,
  behaviorCLIPath,
  defaultBehaviorConfigPath,
  directoryIndexExists,
  directoryIndexPath,
  makeFinalBehaviorImportPath,
};
