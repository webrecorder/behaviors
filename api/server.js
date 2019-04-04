'use strict';
const fastify = require('fastify');
const prepareBehaviors = require('./prepareBehaviors');
const Utils = require('../internal/utils');

/**
 *
 * @param {Object} config
 * @return {Promise<fastify.FastifyInstance>}
 */
module.exports = async function initServer(config) {
  await prepareBehaviors(config);
  if (config.behaviorInfo.build) console.log( );
  console.log('Starting behavior api server with configuration');
  console.log(Utils.inspect(config));
  console.log();
  const server = fastify(config.fastifyOpts);
  server.decorate('conf', config);
  server.register(require('fastify-graceful-shutdown'));
  server.register(require('./routes'));
  server.register(require('./behaviorLookup'));
  const listeningOn = await server.listen(config.port, config.host);
  console.log(
    `Behavior api server listening on\n${
      listeningOn.startsWith('http://127.0.0.1')
        ? listeningOn.replace('http://127.0.0.1', 'http://localhost')
        : listeningOn
    }`
  );
  console.log(server.printRoutes());
  return server;
};
