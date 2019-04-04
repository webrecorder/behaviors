'use strict';
const fs = require('fs-extra');

/**
 * Setups the behavior API routes
 * @param {fastify.FastifyInstance} server
 * @param options
 * @return {Promise<*>}
 */
module.exports = async function(server, options) {
  server.route({
    method: 'GET',
    url: '/behavior',
    schema: {
      querystring: {
        url: { type: 'string' }
      },
      response: {
        200: {
          type: 'string'
        }
      }
    },
    async handler(request, reply) {
      reply.header('Content-Type', 'application/javascript; charset=utf-8');
      const foundBehavior = await server.lookupBehavior(request.query.url);
      return fs.createReadStream(foundBehavior, 'utf8');
    }
  });
  server.route({
    method: 'GET',
    url: '/info',
    schema: {
      querystring: {
        url: { type: 'string' }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            defaultBehavior: { type: 'boolean' },
            description: { type: 'string' },
          }
        }
      }
    },
    handler(request, reply) {
      return server.lookupBehaviorInfo(request.query.url);
    }
  });
  server.route({
    method: 'GET',
    url: '/reload-behaviors',
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            defaultBehavior: { type: 'string' },
            numBehaviors: { type: 'number' }
          }
        }
      }
    },
    handler(request, reply) {
      return server.reloadBehaviors();
    }
  });
};
