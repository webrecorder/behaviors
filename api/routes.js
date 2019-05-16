'use strict';
const fs = require('fs-extra');
const addSchemas = require('./replySchemas');

/**
 * Setups the behavior API routes
 * @param {fastify.FastifyInstance} server
 * @param options
 * @param next
 * @return {Promise<*>}
 */
module.exports = function(server, options, next) {
  addSchemas(server);
  server.route({
    method: 'GET',
    url: '/behavior',
    schema: {
      querystring: {
        url: { type: 'string' },
        name: { type: 'string' },
      },
      response: {
        200: {
          type: 'string',
        },
      },
    },
    async handler(request, reply) {
      reply.header('Content-Type', 'application/javascript; charset=utf-8');
      const foundBehavior = await server.lookupBehavior(request.query);
      return fs.createReadStream(foundBehavior, 'utf-8');
    },
  });
  server.route({
    method: 'GET',
    url: '/info',
    schema: {
      querystring: {
        url: { type: 'string' },
        name: { type: 'string' },
      },
      response: {
        200: 'behavior-info#',
      },
    },
    handler(request, reply) {
      return server.lookupBehaviorInfo(request.query);
    },
  });
  server.route({
    method: 'GET',
    url: '/behavior-list',
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            defaultBehavior: 'default-behavior#',
            behaviors: {
              type: 'array',
              items: { $ref: 'behavior#' },
            },
          },
        },
      },
    },
    handler(request, reply) {
      return server.behaviorList();
    },
  });
  next();
};
