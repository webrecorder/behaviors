const { Project } = require('ts-morph');
const getConfigIfExistsOrDefault = require('./behaviorConfig');
const { resolveWhatPath } = require('./build');
const { defaultBehaviorConfigPath } = require('./paths');

exports.prettierOpts = {
  singleQuote: true,
  trailingComma: 'es5',
  parser: 'babel',
};

exports.BParseOptions = {
  sourceType: 'module',
  plugins: [
    'asyncGenerators',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'objectRestSpread',
  ],
};

exports.makeDefaultBuildCollectOpts = async function makeDefaultBuildCollectOpts() {
  const config = await getConfigIfExistsOrDefault({
    config: defaultBehaviorConfigPath,
    build: true,
  });
  const project = new Project({ tsConfigFilePath: config.tsConfigFilePath });
  const dirPath = await resolveWhatPath(config, 'default collect opts');
  return Object.assign(
    {
      project,
      dir: dirPath,
    },
    config
  );
};
