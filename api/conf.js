'use strict';
const program = require('commander');
const qs = require('qs');
const chalk = require('chalk').default;
const pkg = require('../package');
const internalPaths = require('../internal/paths');
const Utils = require('../internal/utils');

/**
 * The default api server port
 * @type {number}
 */
const DefaultPort = 3030;

/**
 * The default api server host
 * @type {string}
 */
const DefaultHost = '127.0.0.1';

/**
 * Prints a warning for invalid environment config values
 * @param {string} key
 * @param {string} value
 * @param {*} defaultValue
 */
function invalidValue(key, value, defaultValue) {
  console.log(chalk.bold.red(`Invalid value for ${key}: ${value}`));
  console.log(chalk.bold.red(`Using default value: ${defaultValue}`));
}

function convertEnvInt(key, defaultValue) {
  const envValue = process.env[key];
  let value = defaultValue;
  if (envValue != null) {
    try {
      value = parseInt(envValue, 10);
    } catch (e) {
      invalidValue(key, envValue, defaultValue);
    }
    if (isNaN(value)) {
      invalidValue(key, envValue, defaultValue);
      value = defaultValue;
    }
  }
  return value;
}

/**
 * Returns the default port the api server will listen on.
 * If the env variable BEHAVIOR_API_PORT is set returns it's value
 * otherwise returns 3030
 * @return {number}
 */
const getDefaultPort = () => convertEnvInt('BEHAVIOR_API_PORT', DefaultPort);

/**
 * Returns the default port the api server will listen on.
 * If the env variable WR_BEHAVIOR_HOST is set returns it's value
 * otherwise returns 127.0.0.1
 * @return {string}
 */
function getDefaultHost() {
  if (process.env.BEHAVIOR_API_HOST != null) {
    return process.env.BEHAVIOR_API_HOST;
  }
  return DefaultHost;
}

/**
 * Returns the default path to the behaviors.
 * If the env key `WR_BEHAVIOR_DIR` is defined that value is used
 * otherwise `internalPaths.distDir`
 * @return {string}
 */
function getDefaultBehaviorDir() {
  if (process.env.WR_BEHAVIOR_DIR != null) {
    return process.env.WR_BEHAVIOR_DIR;
  }
  return internalPaths.distDir;
}

/**
 * Returns the default path to the behavior metadata file.
 * If the env key `WR_BEHAVIOR_METADATA_PATH` is defined that value is used
 * otherwise `internalPaths.defaultBehaviorMetadataPath`
 * @return {string}
 */
function getDefaultMetadataPath() {
  if (process.env.WR_BEHAVIOR_METADATA_PATH != null) {
    return process.env.WR_BEHAVIOR_METADATA_PATH;
  }
  return internalPaths.defaultBehaviorMetadataPath;
}

/**
 * Returns the default value for the build behaviors flag.
 * If the env key `BUILD_BEHAVIORS` is defined that value is used
 * otherwise false.
 * @return {boolean}
 */
function getDefaultBuildBehaviorsFlag() {
  if (process.env.BUILD_BEHAVIORS) {
    return Utils.envFlagToBool(process.env.BUILD_BEHAVIORS);
  }
  return false;
}

/**
 * Returns the default value for the number of behavior lookup workers.
 * If the env key `NUM_WORKERS`
 * @return {number}
 */
function defaultNumWorkers() {
  const numWorkers = convertEnvInt('NUM_WORKERS', 2);
  if (numWorkers >= 1) return ensureNumWorkers(numWorkers);
  console.log(
    chalk.bold.red(
      `The number of behavior lookup workers cannot be less than 1, got "${numWorkers}". Using default value of 2`
    )
  );
  return 2;
}

function ensureNumWorkers(value) {
  let numWorkers = value;
  if (typeof value === 'string') {
    try {
      numWorkers = parseInt(value, 10);
    } catch (e) {
      invalidValue('workers', value, 2);
      numWorkers = 2;
    }
  }
  if (isNaN(numWorkers)) {
    invalidValue('workers', numWorkers, 2);
    numWorkers = 2;
  } else if (numWorkers < 1) {
    console.log(
      chalk.bold.red(
        `The number of behavior lookup workers must be 1 <= workers <= 4, got "${numWorkers}". Using default value of 2`
      )
    );
    numWorkers = 2;
  } else if (numWorkers > 4) {
    console.log(
      chalk.bold.red(
        `The number of behavior lookup workers must be 1 <= workers <= 4, got "${numWorkers}". Using default value of 2`
      )
    );
    numWorkers = 2;
  }
  return numWorkers;
}

program
  .version(pkg.version)
  .usage('[options]')
  .option(
    '-p, --port [port]',
    'The port the api server is to bind to',
    getDefaultPort()
  )
  .option(
    '-h, --host [host]',
    'The host address the server is listen on',
    getDefaultHost()
  )
  .option(
    '-b, --behaviorDir [behaviorDir]',
    'The path to the directory containing the build behaviors',
    getDefaultBehaviorDir()
  )
  .option(
    '-m, --behaviorMetadata [medataPath]',
    'The path to the behavior metadata',
    getDefaultMetadataPath()
  )
  .option(
    '--build-behaviors',
    'Should the api server build the behaviors for starting up',
    getDefaultBuildBehaviorsFlag()
  )
  .option(
    '-w, --workers [numWorkers]',
    'How many behavior lookup workers should be spawned',
    ensureNumWorkers,
    defaultNumWorkers()
  )
  .parse(process.argv);

const enableLogging = Utils.envFlagToBool(process.env.BEHAVIOR_API_LOGGING);

const qsOpts = {
  charset: 'iso-8859-1',
  interpretNumericEntities: true,
  charsetSentinel: true,
};

// {fastifyOpts: {trustProxy: boolean, maxParamLength: number, logger: boolean, querystringParser: (function(...args: *): *)}, port: number, host: string, numLookupWorkers: number, behaviorInfo: {build: boolean, mdataPath: string, behaviorDir: string}}
/**
 * @typedef {Object} APIConfig
 * @property {string} host
 * @property {number} port
 * @property {number} numLookupWorkers
 * @property {{trustProxy: boolean, maxParamLength: number, logger: boolean, querystringParser: *}} fastifyOpts
 * @property {{build: boolean, mdataPath: string, behaviorDir: string}} behaviorInfo
 */

/**
 * The behavior API server config object
 * @type {APIConfig}
 */
const config = {
  host: program.host,
  port: program.port,
  numLookupWorkers: program.workers,
  behaviorInfo: {
    behaviorDir: program.behaviorDir,
    mdataPath: program.behaviorMetadata,
    build: program.buildBehaviors,
  },
  fastifyOpts: {
    trustProxy: true,
    maxParamLength: 5e12,
    logger: enableLogging || process.env.LOG != null,
    querystringParser: url => qs.parse(url, qsOpts),
  },
};

module.exports = config;
