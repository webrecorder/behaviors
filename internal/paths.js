const path = require('path');
const fs = require('fs-extra');

/**
 * @type {string}
 */
const rootDir = path.join(__dirname, `..${path.sep}`);

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

/**
 * @type {{tsConfigFilePath: string, distDir: string, finalLibDirImportPath: string, directoryIndexExists: (function(string): Promise<boolean | never>), buildDir: string, libDir: string, behaviorDir: string, rootDir: string, makeFinalBehaviorImportPath: (function(string): string), directoryIndexPath: (function(string): string)}}
 */
module.exports = {
  buildDir,
  behaviorDir,
  finalLibDirImportPath,
  libDir,
  rootDir,
  tsConfigFilePath,
  distDir,
  directoryIndexExists,
  directoryIndexPath,
  makeFinalBehaviorImportPath
};
