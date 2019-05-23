const path = require('path');
const fs = require('fs-extra');
const jsYaml = require('js-yaml');
const getConfigIfExistsOrDefault = require('./behaviorConfig');
const { buildAndRun, runBuilt, buildWatchRun } = require('./runner');

const isYamlRe = /\.ya?ml$/i;

function secondsToMilliseconds(value) {
  return typeof value === 'number' ? value * 1000 : null;
}

async function loadConfig(configPath, behaviorBuildPath) {
  let config;
  if (isYamlRe.test(configPath)) {
    const contents = await fs.readFile(configPath, 'utf8');
    config = jsYaml.safeLoad(contents);
  } else {
    config = await fs.readJson(configPath);
  }
  config.buildConfig = await getConfigIfExistsOrDefault({
    config: config.buildConfig || behaviorBuildPath,
    build: config.behavior,
  });
  config.timeout = secondsToMilliseconds(config.timeout);
  config.slowmo = secondsToMilliseconds(config.slowmo);
  return config;
}

function flagsToRunModemode(program) {
  if (program.runBuilt) return 'built';
  if (program.run && program.watch) return 'build-watch';
  return 'build';
}

async function getRunConfigIfExistsOrDefault(program) {
  if (program.config) {
    let configExistsForPath = await fs.pathExists(program.config);
    if (configExistsForPath) {
      return loadConfig(program.config, program.buildConfig);
    }
    const configPathCWD = path.join(process.cwd(), 'behavior-run-config.yml');
    configExistsForPath = await fs.pathExists(configPathCWD);
    if (configExistsForPath) {
      return loadConfig(configPathCWD, program.buildConfig);
    }
  }
  return {
    buildConfig: await getConfigIfExistsOrDefault({
      config: program.buildConfig,
      build: program.args[0],
    }),
    behavior: program.args[0],
    builtPath: program.args[0],
    url: program.url,
    chromeEXE: program.chromeEXE,
    mode: flagsToRunModemode(program),
    timeout: secondsToMilliseconds(program.timeout),
    slowmo: secondsToMilliseconds(program.slowmo),
    openDevTools: false,
  };
}

/**
 *
 * @param {*} program
 * @return {Promise<void>}
 */
async function behaviorRunnerCLI(program) {
  if (program.args.length === 0 && !program.config) {
    program.outputHelp();
    return;
  }
  const config = await getRunConfigIfExistsOrDefault(program);
  switch (config.mode) {
    case 'build':
      await buildAndRun(config);
      break;
    case 'build-watch':
      await buildWatchRun(config);
      break;
    case 'built':
      await runBuilt(config);
      break;
  }
}

module.exports = behaviorRunnerCLI;
