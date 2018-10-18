import * as fs from 'fs-extra';
import path from 'path';

const behaviorWrapper = require('./behavior-wrapper-plugin');

const behaviorDir = path.join('src', 'behaviors');

const wrapperConfig = behaviorWrapper({
  noWrapperFiles: new Set(['autoscroll.js'])
});

export default fs.readdirSync(behaviorDir).map(file => ({
  input: path.join(behaviorDir, file),
  output: {
    file: path.join(process.env.BEHAVIOR_DIR || 'dist', file),
    sourcemap: false,
    format: 'es',
    exports: 'none'
  },
  watch: {
    chokidar: true
  },
  plugins: [wrapperConfig]
}));
