if (process.env.DOCKER && module.paths.indexOf('/build/node_modules') === -1) {
  module.paths.unshift('/build/node_modules');
}
const Path = require('path');
const fs = require('fs-extra');
const jsYaml = require('js-yaml');
const program = require('commander');
const pkg = require('../package');
const Build = require('./build');
const {
  distDir,
  behaviorDir,
  buildDir,
  tsConfigFilePath,
  libDir
} = require('./paths');

program
  .version(pkg.version)
  .option('-v, --validate [fileOrDir]')
  .option('-c, --config [configPath]', 'Path to the behavior config file')
  .option(
    '-b, --build [fileOrDir]',
    'Build a behaviors or all behaviors contained within a directory'
  )
  .option(
    '-w, --watch [distFileOrDir]',
    'Watch the files, and their imports, in the dist directory for re-bundling on changes'
  )
  .option(
    '--metadata [dumpDir]',
    'Generate behavior metadata, optionally supplying a path to directory where metadata is to be placed. Defaults to current working directory'
  )
  .parse(process.argv);

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
async function getConfigIfExistsOrDefault(buildingWhat) {
  let configExistsForPath = await fs.pathExists(program.config);
  if (configExistsForPath) {
    return loadConfig(program.config, buildingWhat);
  }
  const configPathCWD = Path.join(process.cwd(), 'behavior-config.yml');
  configExistsForPath = await fs.pathExists(configPathCWD);
  if (configExistsForPath) {
    return loadConfig(program.config, buildingWhat);
  }
  return {
    what: buildingWhat,
    behaviorDir,
    libDir,
    buildDir,
    distDir,
    tsConfigFilePath,
    metadata: process.cwd()
  };
}

async function run() {
  if (
    [program.validate, program.build, program.metadata, program.watch].every(
      value => !value
    )
  ) {
    program.outputHelp();
    return;
  }
  if (program.build) {
    const config = await getConfigIfExistsOrDefault(program.build);
    await Build.createRunnableBehaviors(config);
    if (program.watch) {
      return Build.watch(config);
    }
  } else if (program.metadata) {
    const config = await getConfigIfExistsOrDefault(program.metadata);
    return Build.generateMetdataFile(config);
  } else if (program.watch) {
    const config = await getConfigIfExistsOrDefault(program.watch);
    return Build.watch(config);
  }
}

run(program).catch(error => console.error(error));

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
