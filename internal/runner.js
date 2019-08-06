const path = require('path');
const { Worker } = require('worker_threads');
const fs = require('fs-extra');
const EventEmitter = require('eventemitter3');
const rollup = require('rollup');
const { launch } = require('just-launch-chrome');
const { Browser, Events } = require('chrome-remote-interface-extra');
const { makeInputOutputConfig } = require('./buildInfo');
const Build = require('./build');
const ColorPrinter = require('./colorPrinter');

async function buildWatchRun(runConfig) {
  const buildWorker = new Worker(path.join(__dirname, 'runnerBuildWorker.js'), {
    workerData: runConfig.buildConfig,
  });
  let run = true;
  buildWorker.on('exit', () => {
    run = false;
  });
  const readyPromise = waitForBuilt(buildWorker);
  const browser = await launchBrowser(runConfig);
  runConfig.builtPath = await readyPromise;
  const stopEE = new EventEmitter();
  const autoRunConfig = {
    browser,
    stopEE,
    runConfig,
  };
  let prr;
  while (run) {
    try {
      await autorun(autoRunConfig);
    } catch (e) {
      console.log(e);
    }
    stopEE.removeAllListeners();
    if (prr == null) prr = promiseResolveReject();
    ColorPrinter.info('Behavior run finished');
    ColorPrinter.info('Waiting for file changes');
    ColorPrinter.blankLine();
    await prr.promise;
    prr = null;
  }
  buildWorker.terminate();
  await browser.close();
}

async function buildAndRun(runConfig) {
  const { runnablePath, runnableDistPath } = await Build.createRunnerConfig(
    runConfig.buildConfig
  );
  const { inConf, outConf } = makeInputOutputConfig(
    runnablePath,
    runnableDistPath
  );
  const bundle = await rollup.rollup(inConf);
  await bundle.write(outConf);
  runConfig.builtPath = runnableDistPath;
  await runBuilt(runConfig);
}

async function runBuilt(runConfig) {
  const browser = await launchBrowser(runConfig);
  try {
    await autorun({
      browser,
      runConfig,
    });
  } catch (e) {
    console.log(e);
  }
  await browser.close();
}

/**
 *
 * @param runnerHandle
 * @param {EventEmitter} stopEE
 * @return {Promise<boolean>}
 */
async function performNextStep(runnerHandle, stopEE) {
  const midEvalStopProm = promiseResolveReject();
  stopEE.once('stop-eval', midEvalStopProm.resolve);
  let result;
  try {
    result = await Promise.race([
      runnerHandle.callFnEval('step'),
      midEvalStopProm.promise,
    ]);
  } catch (e) {
    ColorPrinter.showError('Behavior error', e);
  } finally {
    stopEE.removeListener('stop-eval', midEvalStopProm.resolve, null, true);
  }
  if (result) {
    ColorPrinter.blue(
      `Performed step\n  - done = ${result.done}\n  - wait = ${result.wait}\n  - msg = ${result.msg}`
    );
    if (result.state) {
      console.log(ColorPrinter.chalk.blue('  - state = '), result.state);
    }
    ColorPrinter.blankLine();
    return result.done;
  }
  return true;
}

async function autorun({ browser, stopEE, runConfig }) {
  const page = await browser.newPage();
  const behavior = await fs.readFile(runConfig.builtPath, 'utf8');
  await page.goto(runConfig.url, { waitUntil: 'networkidle2' });

  await page.evaluateWithCliAPI(behavior);

  page.on(Events.Page.Error, error => {
    ColorPrinter.showError('Page error', error);
    ColorPrinter.blankLine();
  });

  page.on(Events.Page.Console, msg => {
    ColorPrinter.info(`Console msg: ${msg.text()}`);
    ColorPrinter.blankLine();
  });
  let pageClosedUnexpectidly = false;
  let run = true;
  let to;

  page.on(Events.Page.Close, () => {
    run = false;
    pageClosedUnexpectidly = true;
    console.log(ColorPrinter.chalk.redBright('Page closed unexpectedly'));
  });

  const runnerHandle = await page.evaluateHandle(() => $WBBehaviorRunner$);

  if (runConfig.timeout) {
    to = setTimeout(() => {
      ColorPrinter.warning(
        `Stopping running behavior due to run time exceeded configured timeout ${runConfig.timeout}`
      );
      ColorPrinter.blankLine();
      run = false;
    }, runConfig.timeout);
  }

  if (stopEE) {
    stopEE.on('stop', () => {
      run = false;
      // performNextStep is mighty funky at times
      // so we use an additional event to tell it
      // to stop
      stopEE.emit('stop-eval');
    });
  }

  try {
    while (run) {
      if (await performNextStep(runnerHandle, stopEE)) break;
      if (runConfig.slowmo) await delay(runConfig.slowmo);
    }
  } catch (e) {
    console.log(e);
  }
  if (to) clearTimeout(to);
  if (runConfig.openDevTools) await delay(6000);
  page.removeAllListeners();
  if (!pageClosedUnexpectidly) {
    await runnerHandle.dispose();
    await page.close({ runBeforeUnload: true });
  }
}

async function launchBrowser(runConfig) {
  const args = [
    '--disable-gpu-process-crash-limit',
    '--disable-backing-store-limit',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--disable-ipc-flooding-protection',
    '--disable-client-side-phishing-detection',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-popup-blocking',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--disable-sync',
    '--disable-domain-reliability',
    '--disable-infobars',
    '--disable-features=site-per-process,TranslateUI',
    '--disable-breakpad',
    '--disable-backing-store-limit',
    '--enable-features=NetworkService,NetworkServiceInProcess,brotli-encoding,AwaitOptimization',
    '--metrics-recording-only',
    '--no-first-run',
    '--safebrowsing-disable-auto-update',
    '--mute-audio',
    '--autoplay-policy=no-user-gesture-required',
  ];
  if (runConfig.openDevTools) {
    args.push('--auto-open-devtools-for-tabs');
  }
  const { closeBrowser, browserWSEndpoint } = await launch({
    executable: runConfig.chromeEXE,
    args,
  });
  return Browser.connect(browserWSEndpoint, {
    closeCallback: closeBrowser,
  });
}

function delay(delayTime) {
  return new Promise(resolve => {
    setTimeout(resolve, delayTime || 3000);
  });
}

function waitForBuilt(buildWorker) {
  return new Promise(resolve => {
    const builtListener = msg => {
      if (msg.type === 'built') {
        ColorPrinter.blankLine();
        ColorPrinter.info('Behavior built');
        ColorPrinter.info('Starting run rebuild loop');
        ColorPrinter.blankLine();
        buildWorker.removeListener('message', builtListener);
        resolve(msg.path);
      }
    };
    buildWorker.on('message', builtListener);
  });
}

function promiseResolveReject() {
  const promResolveReject = { promise: null, resolve: null, reject: null };
  promResolveReject.promise = new Promise((resolve, reject) => {
    promResolveReject.resolve = resolve;
    promResolveReject.reject = reject;
  });
  return promResolveReject;
}

module.exports = {
  buildAndRun,
  runBuilt,
  buildWatchRun,
  autorun,
};
