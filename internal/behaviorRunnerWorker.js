const { parentPort, workerData, MessagePort } = require('worker_threads');
const cp = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const EventEmitter = require('eventemitter3');
const { CRIExtra, Browser, Events } = require('chrome-remote-interface-extra');
const Collector = require('./collect');
const ColorPrinter = require('./colorPrinter');
const { makeInputOutputConfig } = require('./buildInfo');
const getConfigIfExistsOrDefault = require('./behaviorConfig');
const Build = require('./build');
const { Project } = require('ts-morph');
const { launch } = require('launch-chrome');
const rollup = require('rollup');
const nodeResolve = require('rollup-plugin-node-resolve');
const cleanup = require('rollup-plugin-cleanup');
const msgTypes = require('./runnerMsgs');
const it = require('@babel/highlight');

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

async function startBehaviorBuild(msg) {
  const config = await getConfigIfExistsOrDefault(program);
  const { runnablePath, runnableDistPath } = await Build.createRunnerConfig(
    config
  );
  const inoutConf = makeInputOutputConfig(runnablePath, runnableDistPath);

  const watcher = rollup.watch({
    ...inoutConf.inConf,
    output: inoutConf.outConf,
    watch: {
      chokidar: {
        usePolling: process.platform !== 'darwin',
        alwaysStat: true
      }
    }
  });
  watcher.on('event', event => {
    switch (event.code) {
      case 'BUNDLE_START':
        parentPort.postMessage({
          type: msgTypes.rebuildingBehavior
        });
        break;
      case 'BUNDLE_END':
        parentPort.postMessage({
          type: msgTypes.behaviorBuilt
        });
        break;
      case 'ERROR':
        parentPort.postMessage({
          type: msgTypes.buildError,
          error: `${event.error.toString()} \n ${event.error.frame}`,
          frame: event.error.frame
        });
        break;
      default:
        ColorPrinter.printCode(event.frame);
        break;
    }
  });
}

parentPort.on('message', msg => {
  if (msg.type === msgTypes.buildBehavior) {
  }
});
