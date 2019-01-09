'use strict';
const config = require('./conf');
const initServer = require('./server');

initServer(config).catch(error => {
  console.error(`Failed to start server on ${config.host}:${config.port}`);
  console.error(error);
});
