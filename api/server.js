'use strict';
const fastify = require('fastify');
// const BehaviorLookUp = require('./behaviorLookup');

/**
 *
 * @param {Object} config
 * @return {Promise<fastify.FastifyInstance>}
 */
module.exports = async function initServer(config) {
  const server = fastify(config.fastifyOpts);
  server.decorate('conf', config);
  server.register(require('./gracefulShutdown'));
  server.register(require('./routes'));
  server.register(require('./behaviorLookup'));
  const listeningOn = await server.listen(config.port, config.host);
  console.log(
    `Server listening on\n${
      listeningOn.startsWith('http://127.0.0.1')
        ? listeningOn.replace('http://127.0.0.1', 'http://localhost')
        : listeningOn
    }`
  );
  console.log(server.printRoutes());
  return server;
};
