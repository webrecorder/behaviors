const path = require('path');
const fs = require('fs-extra');
const jsYaml = require('js-yaml');
const {
  distDir,
  behaviorDir,
  buildDir,
  tsConfigFilePath,
  libDir,
} = require('./paths');

const isYamlRe = /\.ya?ml$/i;

/**
 * Loads the behavior config
 * @param {string} configPath - The path to the behavior config file
 * @param {boolean|string} buildingWhat - What are we building
 * @return {Promise<Config>}
 */
async function loadConfig(configPath, buildingWhat) {
  const configDirPath = path.dirname(configPath);
  /** @type {Config} */
  const config = {};
  let behaviorConfig;
  if (isYamlRe.test(configPath)) {
    const contents = await fs.readFile(configPath, 'utf8');
    behaviorConfig = jsYaml.safeLoad(contents);
  } else {
    behaviorConfig = await fs.readJson(configPath);
  }
  if (behaviorConfig.behaviors && !path.isAbsolute(behaviorConfig.behaviors)) {
    config.behaviorDir = path.resolve(configDirPath, behaviorConfig.behaviors);
  } else if (!behaviorConfig.behaviors) {
    config.behaviorDir = path.join(configDirPath, 'behaviors');
  } else {
    config.behaviorDir = behaviorConfig.behaviors;
  }

  if (behaviorConfig.lib && !path.isAbsolute(behaviorConfig.lib)) {
    config.libDir = path.resolve(configDirPath, behaviorConfig.lib);
  } else if (!behaviorConfig.lib) {
    config.libDir = require.resolve('../lib');
  } else {
    config.libDir = behaviorConfig.lib;
  }

  if (behaviorConfig.build && !path.isAbsolute(behaviorConfig.build)) {
    config.buildDir = path.resolve(configDirPath, behaviorConfig.build);
  } else if (!behaviorConfig.build) {
    config.buildDir = path.join(configDirPath, 'build');
  } else {
    config.buildDir = behaviorConfig.build;
  }

  if (behaviorConfig.dist && !path.isAbsolute(behaviorConfig.dist)) {
    config.distDir = path.resolve(configDirPath, behaviorConfig.dist);
  } else if (!behaviorConfig.dist) {
    config.distDir = path.join(configDirPath, 'dist');
  } else {
    config.distDir = behaviorConfig.dist;
  }

  if (behaviorConfig.tsconfig && !path.isAbsolute(behaviorConfig.tsconfig)) {
    config.tsConfigFilePath = path.resolve(
      configDirPath,
      behaviorConfig.tsconfig
    );
  } else if (!behaviorConfig.tsconfig) {
    config.tsConfigFilePath = require.resolve('../tsconfig');
  } else {
    config.tsConfigFilePath = behaviorConfig.tsconfig;
  }

  if (behaviorConfig.metadata) {
    config.metadata = path.isAbsolute(behaviorConfig.metadata)
      ? behaviorConfig.metadata
      : path.resolve(configDirPath, behaviorConfig.metadata);
  } else {
    config.metadata = process.cwd();
  }
  config.what = buildingWhat;
  return config;
}

/**
 * Loads the behavior config if the file exists otherwise returns the default config
 * @param {ConfigRetrievalOpts} opts - Options pertaining to how to load the config
 * @return {Promise<Config>}
 */
module.exports = async function getConfigIfExistsOrDefault({ config, build }) {
  let configExistsForPath = await fs.pathExists(config);
  if (configExistsForPath) {
    return loadConfig(config, build);
  }
  const configPathCWD = path.join(process.cwd(), 'behavior-config.yml');
  configExistsForPath = await fs.pathExists(configPathCWD);
  if (configExistsForPath) {
    return loadConfig(configPathCWD, build);
  }
  return {
    what: build,
    behaviorDir,
    libDir,
    buildDir,
    distDir,
    tsConfigFilePath,
    metadata: process.cwd(),
  };
};

/**
 * @typedef {Object} ConfigRetrievalOpts
 * @property {string} config - Path to the config file
 * @property {string|boolean} build - What is being built
 */
