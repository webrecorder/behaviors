'use strict';
const program = require('commander');
const qs = require('qs');
const internalPaths = require('../internal/paths');
const Utils = require('../internal/utils');
const pkg = require('../package');

/**
 * @desc The default api server port
 * @type {number}
 */
const DefaultPort = 3030;

/**
 * @desc The default api server host
 * @type {string}
 */
const DefaultHost = '127.0.0.1';

/**
 * @desc Returns the default port the api server will listen on.
 * If the env variable BEHAVIOR_API_PORT is set returns it's value
 * otherwise returns 3030
 * @return {number}
 */
function getDefaultPort() {
  if (process.env.BEHAVIOR_API_PORT != null) {
    try {
      return parseInt(process.env.BEHAVIOR_API_PORT);
    } catch (e) {
      return DefaultPort;
    }
  }
  return DefaultPort;
}

/**
 * @desc Returns the default port the api server will listen on.
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

function getDefaultBehaviorDir() {
  if (process.env.WR_BEHAVIOR_DIR != null) {
    return process.env.WR_BEHAVIOR_DIR;
  }
  return internalPaths.distDir;
}

function getDefaultMetadataPath() {
  if (process.env.WR_BEHAVIOR_METADATA_PATH != null) {
    return process.env.WR_BEHAVIOR_METADATA_PATH;
  }
  return internalPaths.defaultBehaviorMetadataPath;
}

function getDefaultBuildBehaviorsFlag() {
  if (process.env.BUILD_BEHAVIORS) {
    return Utils.envFlagToBool(process.env.BUILD_BEHAVIORS);
  }
  return false;
}

program
  .version(pkg.version)
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
  .parse(process.argv);

const enableLogging = Utils.envFlagToBool(process.env.BEHAVIOR_API_LOGGING);

const qsOpts = {
  charset: 'iso-8859-1',
  interpretNumericEntities: true,
  charsetSentinel: true
};

/**
 *
 * @type {{fastifyOpts: {trustProxy: boolean, maxParamLength: number}, port: number, host: number, behaviorInfo: {mdataPath: string, behaviorDir: string}}}
 */
const config = {
  host: program.host,
  port: program.port,
  behaviorInfo: {
    behaviorDir: program.behaviorDir,
    mdataPath: program.behaviorMetadata,
    build: program.buildBehaviors
  },
  fastifyOpts: {
    trustProxy: true,
    maxParamLength: 5e12,
    logger: enableLogging || process.env.LOG != null,
    querystringParser: url => qs.parse(url, qsOpts)
  }
};

module.exports = config;
