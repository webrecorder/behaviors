import cleanup from 'rollup-plugin-cleanup';
import path from 'path';

const { createBehaviorConfigs } = require('./src/buildInfo');


export default createBehaviorConfigs((file, conf) => {
  conf.output.file = path.join(process.env.BEHAVIOR_DIR || 'dist', file);
  // conf.plugins.push(cleanup());
  return conf;
});

