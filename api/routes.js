'use strict';
const fs = require('fs-extra');
const addSchemas = require('./replySchemas');

/**
 * Setups the behavior API routes
 * @param {fastify.FastifyInstance} server
 * @param {BehaviorLookUp} behaviorLookUp
 */
function initRoutes(server, behaviorLookUp) {
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
      const foundBehavior = await behaviorLookUp.lookupBehavior(request);
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
      return behaviorLookUp.info(request);
    },
  });
  server.route({
    method: 'GET',
    url: '/info-list',
    schema: {
      querystring: {
        url: { type: 'string' },
        name: { type: 'string' },
      },
      response: {
        200: 'behavior-info-list#',
      },
    },
    async handler(request, reply) {
      const infoList = await behaviorLookUp.infoList(request);
      return { behaviors: infoList };
    },
  });
  server.route({
    method: 'GET',
    url: '/info-all',
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            defaultBehavior: 'behavior-info#',
            behaviors: 'behavior-list#',
          },
        },
      },
    },
    handler(request, reply) {
      return behaviorLookUp.allInfo();
    },
  });
}

module.exports = initRoutes;
