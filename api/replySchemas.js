function addSchemas(server) {
  server.addSchema({
    $id: 'behavior-info',
    type: 'object',
    properties: {
      name: { type: 'string' },
      fileName: { type: 'string' },
      defaultBehavior: { type: 'boolean' },
      description: { type: 'string' },
      updated: { type: 'string' },
      displayName: { type: 'string' },
      match: {
        type: 'object',
        properties: {
          regex: { type: 'string' },
        },
      },
    },
  });
  server.addSchema({
    $id: 'behavior-list',
    type: 'array',
    items: {
      $ref: 'behavior-info#',
    },
  });
  server.addSchema({
    $id: 'behavior-info-list',
    type: 'object',
    properties: {
      behaviors: 'behavior-list#',
    },
  });
}

module.exports = addSchemas;
