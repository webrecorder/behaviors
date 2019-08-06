const { parentPort, workerData } = require('worker_threads');
const rollup = require('rollup');
const Build = require('./build');
const ColorPrinter = require('./colorPrinter');
const { makeInputOutputConfig } = require('./buildInfo');

Build.createRunnerConfig(workerData)
  .then(({ runnablePath, runnableDistPath }) => {
    const inoutConf = makeInputOutputConfig(runnablePath, runnableDistPath);
    const watcher = rollup.watch({
      ...inoutConf.inConf,
      output: inoutConf.outConf,
      watch: {
        chokidar: {
          usePolling: process.platform !== 'darwin',
        },
      },
    });
    watcher.on('event', event => {
      switch (event.code) {
        case 'FATAL':
          ColorPrinter.error('Behavior Fatal Build Error');
          ColorPrinter.error(
            `${event.error.toString()} \n ${event.error.frame}`
          );
          ColorPrinter.blankLine();
          parentPort.postMessage({
            type: 'fatal',
          });
          break;
        case 'BUNDLE_START':
          parentPort.postMessage({
            type: 'building',
          });
          break;
        case 'BUNDLE_END':
          parentPort.postMessage({
            type: 'built',
            path: runnableDistPath,
          });
          break;
        case 'ERROR':
          ColorPrinter.error('Behavior Build Error');
          ColorPrinter.error(
            `${event.error.toString()} \n ${event.error.frame}`
          );
          ColorPrinter.blankLine();
          break;
      }
    });
  })
  .catch(error => {
    ColorPrinter.error('Behavior Fatal Build Error');
    ColorPrinter.error(error);
    ColorPrinter.blankLine();
    console.error(error);
    parentPort.postMessage({
      type: 'fatal',
    });
  });
