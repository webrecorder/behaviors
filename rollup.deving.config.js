import * as path from 'path';
import resolve from 'rollup-plugin-node-resolve';
import cleanup from 'rollup-plugin-cleanup';

const { wrappers } = require('./internal/buildInfo');
const { buildDir, distDir } = require('./internal/paths');

const behavior = 'twitterNewTwitterTimelineBehavior.js';
const behaviorPath = path.join(buildDir, behavior);

console.log(buildDir);
console.log(behaviorPath);

export default {
  input: behaviorPath,
  output: {
    file: path.join(distDir, behavior),
    sourcemap: false,
    format: 'es',
    exports: 'none'
  },
  watch: { chokidar: true },
  plugins: [
    resolve(),
    cleanup(),
    wrappers.setup
  ]
};
