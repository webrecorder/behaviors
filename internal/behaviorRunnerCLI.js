const cp = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const EventEmitter = require('eventemitter3');
const { CRIExtra, Browser } = require('chrome-remote-interface-extra');
const Collector = require('./collect');
const ColorPrinter = require('./colorPrinter');
const { makeInputOutputConfig } = require('./buildInfo');
const getConfigIfExistsOrDefault = require('./behaviorConfig');
const Build = require('./build');
const { Project } = require('ts-morph');

/**
 * @return {Promise<Browser>}
 */
async function connectToBrowser() {
  const { webSocketDebuggerUrl } = await CRIExtra.Version();
  return Browser.connect(webSocketDebuggerUrl);
}

async function runBehavior(config) {
  const browser = await connectToBrowser();
}

class BehaviorRunner {
  static async start(configPath) {
    const runner = new BehaviorRunner(configPath);
  }
  constructor(config) {
    this.config = config;
    /**
     * @type {Behavior}
     */
    this._rollupProcess = null;
  }

  async init() {
    console.log(this.config);
    const { inConf, outConf } = makeInputOutputConfig(
      this.config.behaviorBuildPath,
      this.config.behaviorDistPath
    );
    const rollupBin = path.join(
      __dirname,
      '..',
      'node_modules',
      '.bin',
      'rollup'
    );
    // this._rollupProcess = cp.fork(rollupBin);
  }
}

function createRollupConfig(opts) {
  return `import resolve from '${opts.rollupResolve}';
import cleanup from '${opts.rollupCleanup}';

const { wrappers } = require('${opts.buildInfo}');

export default {
  input: '${opts.input}',
  output: {
    file: '${opts.output}',
    sourcemap: false,
    format: 'es',
    exports: 'none'
  },
  watch: { chokidar: {usePolling: true, }, clearScreen:  true },
  plugins: [
    resolve(),
    cleanup(),
    wrappers.setup
  ]
};

`;
}

module.exports = async function runnerCLI(program) {
  if (program.args.length === 0) {
    program.outputHelp();
    return;
  }
  program.build = program.args[0];
  const config = await getConfigIfExistsOrDefault(program);
  const { runnablePath, runnableDistPath } = await Build.createRunnerConfig(
    config
  );
  console.log(runnablePath, runnableDistPath);
  ColorPrinter.blankLine();
  ColorPrinter.info('Generating build config');
  const rollupConfigPath = path.join(
    process.cwd(),
    'wr-behaviors-run-build.config.js'
  );
  const nodeModules = path.join(__dirname, '..', 'node_modules');
  await fs.writeFile(
    rollupConfigPath,
    createRollupConfig({
      input: runnablePath,
      output: runnableDistPath,
      rollupResolve: path.join(nodeModules, 'rollup-plugin-node-resolve'),
      rollupCleanup: path.join(nodeModules, 'rollup-plugin-cleanup'),
      buildInfo: require.resolve('./buildInfo')
    })
  );

  const rollupBin = path.join(
    __dirname,
    '..',
    'node_modules',
    '.bin',
    'rollup'
  );

  const rollupProcess = cp.spawn(
    'node',
    [rollupBin, '--watch', '-c', rollupConfigPath],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );


  const createdBuffer = Buffer.from('1b5b33326d63726561746564201b5b316d646973742f736f75', 'hex');

  rollupProcess.stderr.on('data', data => {
    if (data.indexOf(createdBuffer) === 0) {
      console.log('created' , data.toString());
    } else {
      console.log('other', data.toString());
    }
  });
};
