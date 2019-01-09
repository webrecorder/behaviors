import path from 'path';

const { createBehaviorConfigs } = require('/internal/buildInfo');

export default createBehaviorConfigs((file, conf) => {
  conf.output.file = path.join(process.env.BEHAVIOR_DIR || '/dist', file);
  return conf;
});

