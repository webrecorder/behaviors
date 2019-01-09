'use strict';
const program = require('commander');
const qs = require('qs');

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
 * If the env variable WR_BEHAVIOR_PORT is set returns it's value
 * otherwise returns 3030
 * @return {number}
 */
function getDefaultPort() {
  if (process.env.WR_BEHAVIOR_PORT != null) {
    try {
      return parseInt(process.env.WR_BEHAVIOR_PORT);
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
  if (process.env.WR_BEHAVIOR_HOST != null) {
    return process.env.WR_BEHAVIOR_HOST;
  }
  return DefaultHost;
}

function getDefaultBehaviorDir() {
  if (process.env.WR_BEHAVIOR_DIR != null) {
    return process.env.WR_BEHAVIOR_DIR;
  }
  if (process.env.INDOCKER != null) {
    return '/behaviorDir';
  }
  return require('../internal/paths').distDir;
}

function getDefaultMetadataPath() {
  if (process.env.WR_BEHAVIOR_METADATA_PATH != null) {
    return process.env.WR_BEHAVIOR_METADATA_PATH;
  }
  if (process.env.INDOCKER != null) {
    return '/behaviorDir/behaviorMetadata.js';
  }
  return null;
}

program
  .version('1.0.0')
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
  .parse(process.argv);

const enableLogging = true;

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
    mdataPath: program.behaviorMetadata
  },
  fastifyOpts: {
    trustProxy: true,
    maxParamLength: 5e12,
    logger: enableLogging || process.env.LOG != null,
    querystringParser: url => qs.parse(url, qsOpts)
  }
};

module.exports = config;
