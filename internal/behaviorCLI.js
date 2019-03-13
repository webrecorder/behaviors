const Path = require('path');
const fs = require('fs-extra');
const jsYaml = require('js-yaml');
const Build = require('./build');
const {
  distDir,
  behaviorDir,
  buildDir,
  tsConfigFilePath,
  libDir
} = require('./paths');

const isYamlRe = /\.ya?ml$/i;

/**
 * @param {string} configPath
 * @param {boolean|string} buildingWhat
 * @return {Promise<Config>}
 */
async function loadConfig(configPath, buildingWhat) {
  const configDirPath = Path.dirname(configPath);
  /** @type {Config} */
  const config = {};
  let behaviorConfig;
  if (isYamlRe.test(configPath)) {
    const contents = await fs.readFile(configPath, 'utf8');
    behaviorConfig = jsYaml.safeLoad(contents);
  } else {
    behaviorConfig = await fs.readJson(configPath);
  }
  if (behaviorConfig.behaviors && !Path.isAbsolute(behaviorConfig.behaviors)) {
    config.behaviorDir = Path.resolve(configDirPath, behaviorConfig.behaviors);
  } else if (!behaviorConfig.behaviors) {
    config.behaviorDir = Path.join(configDirPath, 'behaviors');
  } else {
    config.behaviorDir = behaviorConfig.behaviors;
  }

  if (behaviorConfig.lib && !Path.isAbsolute(behaviorConfig.lib)) {
    config.libDir = Path.resolve(configDirPath, behaviorConfig.lib);
  } else if (!behaviorConfig.lib) {
    config.libDir = require.resolve('../lib');
  } else {
    config.libDir = behaviorConfig.lib;
  }

  if (behaviorConfig.build && !Path.isAbsolute(behaviorConfig.build)) {
    config.buildDir = Path.resolve(configDirPath, behaviorConfig.build);
  } else if (!behaviorConfig.build) {
    config.buildDir = Path.join(configDirPath, 'build');
  } else {
    config.buildDir = behaviorConfig.build;
  }

  if (behaviorConfig.dist && !Path.isAbsolute(behaviorConfig.dist)) {
    config.distDir = Path.resolve(configDirPath, behaviorConfig.dist);
  } else if (!behaviorConfig.dist) {
    config.distDir = Path.join(configDirPath, 'dist');
  } else {
    config.distDir = behaviorConfig.dist;
  }

  if (behaviorConfig.tsconfig && !Path.isAbsolute(behaviorConfig.tsconfig)) {
    config.tsConfigFilePath = Path.resolve(
      configDirPath,
      behaviorConfig.tsconfig
    );
  } else if (!behaviorConfig.tsconfig) {
    config.tsConfigFilePath = require.resolve('../tsconfig');
  } else {
    config.tsConfigFilePath = behaviorConfig.tsconfig;
  }

  if (behaviorConfig.metadata) {
    config.metadata = Path.isAbsolute(behaviorConfig.metadata)
      ? behaviorConfig.metadata
      : Path.resolve(configDirPath, behaviorConfig.metadata);
  } else {
    config.metadata = process.cwd();
  }
  config.what = buildingWhat;
  return config;
}

/**
 *
 * @return {Promise<Config>}
 */
async function getConfigIfExistsOrDefault(program) {
  let configExistsForPath = await fs.pathExists(program.config);
  if (configExistsForPath) {
    return loadConfig(program.config, program.build);
  }
  const configPathCWD = Path.join(process.cwd(), 'behavior-config.yml');
  configExistsForPath = await fs.pathExists(configPathCWD);
  if (configExistsForPath) {
    return loadConfig(configPathCWD, program.build);
  }
  return {
    what: program.build,
    behaviorDir,
    libDir,
    buildDir,
    distDir,
    tsConfigFilePath,
    metadata: process.cwd()
  };
}

module.exports = async function behaviorCLI(program) {
  if (
    [program.validate, program.build, program.metadata, program.watch].every(
      value => !value
    )
  ) {
    program.outputHelp();
    return;
  }
  const config = await getConfigIfExistsOrDefault(program);
  if (program.build) {
    await Build.createRunnableBehaviors(config);
    if (program.watch) {
      return Build.watch(config);
    }
  } else if (program.metadata) {
    return Build.generateMetdataFile(config);
  } else if (program.watch) {
    return Build.watch(config);
  }
};


/**
 * @typedef {Object} Config
 * @property {boolean|string} what
 * @property {string} behaviorDir
 * @property {string} libDir
 * @property {string} buildDir
 * @property {string} distDir
 * @property {string} tsConfigFilePath
 * @property {string} [metadata]
 */
