'use strict';
const isCI = require('is-ci');
const config = require('../../api/conf');
const initServer = require('../../api/server');

/**
 * Starts the behavior API server
 * @param {Object} [extraOpts]
 * @return {Promise<fastify.FastifyInstance>}
 */
function startServer(extraOpts) {
  const serverConfig = Object.assign({}, config, extraOpts);
  if (isCI) {
    serverConfig.behaviorInfo.build = true;
  }
  return initServer(serverConfig);
}

module.exports = startServer;
