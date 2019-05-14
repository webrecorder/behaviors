#!/usr/bin/env node
'use strict';
const program = require('commander');
const pkg = require('../package');
const { defaultBehaviorConfigPath } = require('../internal/paths');
const behaviorRunnerCLI = require('../internal/behaviorRunnerCLI');

program
  .version(pkg.version)
  .option(
    '-c, --config [configPath]',
    'Path to the behavior config file',
    defaultBehaviorConfigPath
  )
  .option(
    '-p, --debugging-port <port>',
    'The port the remote debugging port is listening on'
  )
  .parse(process.argv);

behaviorRunnerCLI(program).catch(error => {
  console.error(error);
  process.exit(1);
});

/**
 * @typedef {Object} Config
 * @property {boolean|string} what
 * @property {string} behaviorDir
 * @property {string} libDir
 * @property {string} buildDir
 * @property {string} distDir
 * @property {string} tsConfigFilePath
 * @property {string} [metadata]
 */
