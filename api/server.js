'use strict';
const fastify = require('fastify');
const prepareBehaviors = require('./prepareBehaviors');
const BehaviorLookUp = require('./behaviorLookup');
const Utils = require('../internal/utils');

/**
 *
 * @param {Object} config
 * @return {Promise<fastify.FastifyInstance>}
 */
module.exports = async function initServer(config) {
  await prepareBehaviors(config);
  if (config.behaviorInfo.build) console.log();
  console.log('Starting behavior api server with configuration');
  console.log(Utils.inspect(config));
  console.log();
  const behaviorLookerUpper = new BehaviorLookUp(config);
  behaviorLookerUpper.init();
  const server = fastify(config.fastifyOpts);
  server
    .decorate('conf', config)
    .register(require('fastify-graceful-shutdown'), { timeout: 3000 })
    .register(require('./routes'))
    .decorate('behaviorLookUp', behaviorLookerUpper)
    .decorate('lookupBehavior', behaviorLookerUpper.lookupBehavior)
    .decorate('lookupBehaviorInfo', behaviorLookerUpper.lookupBehaviorInfo)
    .decorate('behaviorList', behaviorLookerUpper.behaviorList)
    .decorate('reloadBehaviors', behaviorLookerUpper.reloadBehaviors)
    .addHook('onClose', (server, done) => {
      behaviorLookerUpper.shutdown(done);
    });
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
