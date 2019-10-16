const Path = require('path');
const fs = require('fs-extra');
const plur = require('plur');
const prettier = require('prettier');
const { Project } = require('ts-morph');
const rollup = require('rollup');
const Collect = require('./collect');
const ColorPrinter = require('./colorPrinter');
const { prettierOpts } = require('./defaultOpts');
const { makeInputOutputConfig } = require('./buildInfo');
const Utils = require('./utils');

async function serializeMetadata(opts, behaviorMetadata) {
  const buildMetadataStartTime = process.hrtime();
  const mdataFPJs = opts.metadata.endsWith('.js')
    ? opts.metadata
    : Path.join(opts.metadata, 'behaviorMetadata.js');
  const mdataFPJson = mdataFPJs.replace('.js', '.json');
  const safeString = Utils.inspect(behaviorMetadata, {
    depth: null,
    compact: false,
  });
  await fs.writeFile(mdataFPJs, `module.exports = ${safeString};`);
  await fs.writeJson(mdataFPJson, behaviorMetadata, {
    replacer(key, value) {
      if (value instanceof RegExp) {
        return value.source;
      }
      return value;
    },
  });
  ColorPrinter.info(
    `Metadata created in ${Utils.timeDiff(
      buildMetadataStartTime
    )} and can be found at ${mdataFPJs}`
  );
}

/**
 * Removes the .js extension from the supplied behavior path
 * if the path ends with it
 * @param {string} behaviorP - A path to a behavior
 * @return {string}
 */
function ensureNoBehaviorPJsExt(behaviorP) {
  if (behaviorP.endsWith('.js')) {
    return behaviorP.substring(0, behaviorP.indexOf('.js'));
  }
  return behaviorP;
}

function initRunnableBehavior({ behavior, libP }) {
  const dImport = behavior.importName;
  const behaviorP = behavior.importPathRelativeToBuildDir;
  const cliAPI =
    '{ $x: maybePolyfillXPG(window.$x), getEventListeners: window.getEventListeners }';
  let behaviorImport;
  let init;
  if (behavior.hasPostStep) {
    behaviorImport = `import ${dImport}, { postStep } from '${ensureNoBehaviorPJsExt(
      behaviorP
    )}';`;
    init = `behaviorStepIterator: ${dImport}(${cliAPI}), postStepFN: postStep`;
  } else {
    behaviorImport = `import ${dImport} from '${ensureNoBehaviorPJsExt(
      behaviorP
    )}';`;
    init = `behaviorStepIterator: ${dImport}(${cliAPI})`;
  }

  const code = `${behaviorImport}
import { maybePolyfillXPG, initRunnableBehavior } from '${libP}';

initRunnableBehavior({ win: window, ${init}, metadata: ${behavior.rawMetadata} });
`;
  return prettier.format(code, prettierOpts);
}

/**
 * Attempts to resolve what we are building to an absolute path
 * @param {Config} opts - The behavior config
 * @param {string} operation - The operation being performed
 * @return {Promise<string>}
 */
async function resolveWhatPath(opts, operation) {
  if (Utils.isBoolean(opts.what)) {
    if (!(await fs.pathExists(opts.behaviorDir))) {
      throw new Error(
        `${operation} failed because the behavior directory does not exist: ${opts.behaviorDir}`
      );
    }
    return opts.behaviorDir;
  }

  if (Path.isAbsolute(opts.what)) {
    if (!(await fs.pathExists(opts.what))) {
      throw new Error(
        `${operation} failed because the behavior(s) path ${opts.what} does not exist`
      );
    }
    return opts.what;
  }

  const relResolvedWhat = Path.resolve(opts.what);
  if (await fs.pathExists(relResolvedWhat)) {
    return relResolvedWhat;
  }
  const pathsToTry = [
    Path.join(opts.behaviorDir, opts.what),
    Path.join(process.cwd(), opts.what),
    Path.join(opts.behaviorDir, relResolvedWhat),
    Path.join(process.cwd(), relResolvedWhat),
  ];
  for (const p of pathsToTry) {
    if (await fs.pathExists(p)) {
      return p;
    }
  }
  throw new Error(
    `${operation} failed because the behavior(s) path ${
      opts.what
    } does not exist and we tried the following paths: \n-- ${relResolvedWhat}${pathsToTry.join(
      '\n-- '
    )}`
  );
}

/**
 * Determines if we are building a single behavior or an directory of behaviors
 * @param {Config} opts - The behavior config
 * @param {string} operation - The operation being performed
 * @return {Promise<{isDir: boolean, path: string}>}
 */
async function buildingWhat(opts, operation) {
  const resolvedWhat = await resolveWhatPath(opts, operation);
  try {
    const stat = await fs.stat(resolvedWhat);
    return {
      isDir: stat.isDirectory(),
      path: resolvedWhat,
    };
  } catch (e) {
    throw new Error(
      `${operation} failed because due to an error ${e} when determining if the operation is working on a directory or a file: path ${resolvedWhat}`
    );
  }
}

/**
 * Updates the supplied behavior metadata object
 * @param {Behavior} behavior - A behavior
 * @param {{defaultBehavior: Object, behaviors: Array<Object>}} behaviorMetadata - The behavior metadata object
 */
function updateBehaviorMetadata(behavior, behaviorMetadata) {
  if (behavior.isDefaultBehavior) {
    behaviorMetadata.defaultBehavior = behavior.metadata;
  } else {
    behaviorMetadata.behaviors.push(behavior.metadata);
  }
}

async function createRunnableBehaviorInBuildDir(behavior, opts) {
  let runnablePath;
  if (behavior.checkStateGood) {
    const code = initRunnableBehavior({ behavior, libP: opts.libDir });
    runnablePath = behavior.filePathInBuildDir;
    await fs.writeFile(runnablePath, code, 'utf8');
  } else {
    runnablePath = behavior.filePathInBuildDir;
    await fs.copy(behavior.path, behavior.filePathInBuildDir, {
      overwrite: true,
    });
  }
  return runnablePath;
}

async function createRunnerConfig(opts) {
  const project = new Project({ tsConfigFilePath: opts.tsConfigFilePath });
  const resolvedWhat = await buildingWhat(opts, 'Creation of runner config');
  await fs.ensureDir(opts.buildDir);
  await fs.ensureDir(opts.distDir);
  const finalOpts = Object.assign(
    {
      project: project,
      file: resolvedWhat.path,
    },
    opts
  );
  const behavior = Collect.behaviorFromFile(finalOpts);
  behavior.init();
  const runnablePath = await createRunnableBehaviorInBuildDir(
    behavior,
    finalOpts
  );
  const runnableDistPath = Path.join(opts.distDir, behavior.buildFileName);
  return { runnablePath, runnableDistPath };
}

/**
 * Creates runnable behavior(s) for a directory containing behaviors
 * @param {Config} opts - The behavior config
 * @param {string} dirPath - The behavior config
 * @return {Promise<Array<Behavior>>}
 */
async function createRunnableBehaviorsFromDir(opts, dirPath) {
  ColorPrinter.info(
    `Creating runnable behaviors for all behaviors found in the directory located at ${dirPath}`
  );
  const project = new Project({ tsConfigFilePath: opts.tsConfigFilePath });
  ColorPrinter.blankLine();
  const finalOpts = Object.assign(
    {
      project: project,
      dir: dirPath,
    },
    opts
  );
  const behaviors = Collect.behaviorsFromDir(finalOpts);
  const numBehaviors = behaviors.length;
  const behaviorMetadata = {
    defaultBehavior: {},
    behaviors: [],
  };
  ColorPrinter.blankLine();
  ColorPrinter.info(
    `Creating ${numBehaviors} runnable ${plur('behavior', numBehaviors)}`
  );
  ColorPrinter.blankLine();
  const createBuildStartTime = process.hrtime();
  for (var i = 0; i < numBehaviors; ++i) {
    await createRunnableBehavior(behaviors[i], finalOpts);
    updateBehaviorMetadata(behaviors[i], behaviorMetadata);
    ColorPrinter.blankLine();
  }
  ColorPrinter.info(
    `Created ${numBehaviors} runnable ${plur(
      'behavior',
      numBehaviors
    )} in ${Utils.timeDiff(createBuildStartTime)}`
  );
  await serializeMetadata(opts, behaviorMetadata);
  return behaviors;
}

/**
 * Creates runnable behavior from a file
 * @param {Config} opts - The behavior config
 * @param {string} filePath - The behavior config
 * @return {Promise<Behavior>}
 */
async function createRunnableBehaviorFromFile(opts, filePath) {
  ColorPrinter.info(
    `Creating runnable behaviors for the behavior located at ${filePath}`
  );
  ColorPrinter.blankLine();
  const project = new Project({ tsConfigFilePath: opts.tsConfigFilePath });
  const finalOpts = Object.assign(
    {
      project: project,
      file: filePath,
      dir: opts.behaviorDir,
    },
    opts
  );
  const behavior = Collect.behaviorFromFile(finalOpts);
  if (!behavior) return null;
  await createRunnableBehavior(behavior, finalOpts);
  return behavior;
}

/**
 * Creates runnable behavior(s) for either a directory containing behaviors
 * or a single behavior
 * @param {Config} opts - The behavior config
 * @return {Promise<Array<Behavior> | Behavior | null>}
 */
async function createRunnableBehaviors(opts) {
  const totalTime = process.hrtime();
  const resolvedWhat = await buildingWhat(
    opts,
    'Creation of runnable behaviors'
  );
  await fs.ensureDir(opts.buildDir);
  await fs.ensureDir(opts.distDir);
  const createFn = resolvedWhat.isDir
    ? createRunnableBehaviorsFromDir
    : createRunnableBehaviorFromFile;
  const behaviorOrBehaviors = await createFn(opts, resolvedWhat.path);
  ColorPrinter.info(`Total time: ${Utils.timeDiff(totalTime)}`);
  return behaviorOrBehaviors;
}

/**
 * Creates a runnable behavior for the supplied behavior
 * @param {Behavior} behavior - The behavior to create a runnable file for
 * @param {Config} opts - The behavior config
 * @return {Promise<{buildFileName: string, runnableDistPath: string}|null>}
 */
async function createRunnableBehavior(behavior, opts) {
  const startTime = process.hrtime();
  behavior.init();
  const buildFileName = behavior.buildFileName;
  ColorPrinter.info(`Creating runnable behavior for ${buildFileName}`);
  const runnablePath = await createRunnableBehaviorInBuildDir(behavior, opts);
  ColorPrinter.info(
    `Runnable behavior's build file created in ${Utils.timeDiff(
      startTime
    )}: ${buildFileName} -> ${runnablePath}`
  );

  ColorPrinter.info('Building runnable behavior');
  const runnableDistPath = Path.join(opts.distDir, buildFileName);
  const { inConf, outConf } = makeInputOutputConfig(
    runnablePath,
    runnableDistPath
  );
  const buildStartTime = process.hrtime();
  try {
    const bundle = await rollup.rollup(inConf);
    await bundle.write(outConf);
  } catch (error) {
    ColorPrinter.showError(
      `Could not build the runnable behavior found at ${runnablePath}`,
      error
    );
    return null;
  }
  ColorPrinter.info(
    `Runnable behavior built in ${Utils.timeDiff(
      buildStartTime
    )}: ${runnablePath} -> ${runnableDistPath}`
  );
  return { buildFileName, runnableDistPath };
}

/**
 * Watches the behaviors for changes and rebuilds them on a change
 * @param {Config} config - The behavior config
 * @return {Promise<void>}
 */
async function watch(config) {
  let watcher;
  const resolvedWhat = await buildingWhat(
    config,
    'Watching behaviors for changes'
  );
  if (resolvedWhat.isDir) {
    watcher = rollup.watch(
      fs.readdirSync(resolvedWhat.path).map(file => {
        const inoutConf = makeInputOutputConfig(
          Path.join(resolvedWhat.path, file),
          Path.join(config.distDir, file)
        );
        return {
          ...inoutConf.inConf,
          output: inoutConf.outConf,
          watch: {
            chokidar: {
              usePolling: process.platform !== 'darwin',
              alwaysStat: true,
            },
          },
        };
      })
    );
  } else {
    const filePath = resolvedWhat.path;
    const outPath = Path.join(config.distDir, Path.basename(resolvedWhat.path));
    const inoutConf = makeInputOutputConfig(filePath, outPath);
    watcher = rollup.watch({
      ...inoutConf.inConf,
      output: inoutConf.outConf,
      watch: {
        chokidar: {
          usePolling: process.platform !== 'darwin',
          alwaysStat: true,
        },
      },
    });
  }
  const relativeId = id => Path.relative(process.cwd(), id);
  watcher.on('event', event => {
    switch (event.code) {
      case 'FATAL':
        console.error(event.error);
        process.exit(1);
        break;
      case 'ERROR':
        console.error(event.error);
        break;
      case 'BUNDLE_START':
        var input_1 = event.input;
        if (typeof input_1 !== 'string') {
          input_1 = Array.isArray(input_1)
            ? input_1.join(', ')
            : Object.keys(input_1)
                .map(function(key) {
                  return input_1[key];
                })
                .join(', ');
        }
        console.log(input_1, '->', event.output.map(relativeId).join(', '));
        break;
      case 'BUNDLE_END':
        console.log(
          `created ${event.output.map(relativeId).join(', ')} in ${
            event.duration
          }ms`
        );
        break;
      case 'END':
        console.log('\nwaiting for changes...');
        console.log();
        break;
    }
  });
}

/**
 * Generates the behavior metadata file for all behaviors
 * @param {Config} opts - The behavior config
 * @return {Promise<void>}
 */
async function generateMetdataFile(opts) {
  const project = new Project({ tsConfigFilePath: opts.tsConfigFilePath });
  const resolvedWhat = await buildingWhat(opts, 'Generating metadata file');

  if (!resolvedWhat.isDir) {
    ColorPrinter.error('Can only create the metadata file for all behaviors');
    return;
  }

  ColorPrinter.info(
    `Creating runnable behaviors for all behaviors found in the directory located at ${resolvedWhat.path}`
  );
  ColorPrinter.blankLine();
  const finalOpts = Object.assign(
    {
      project: project,
      dir: resolvedWhat.path,
    },
    opts
  );
  const behaviors = Collect.behaviorsFromDir(finalOpts);
  const numBehaviors = behaviors.length;
  const behaviorMetadata = {
    defaultBehavior: {},
    behaviors: [],
  };
  ColorPrinter.blankLine();
  ColorPrinter.info(
    `Creating the metadata file for ${numBehaviors} ${plur(
      'behavior',
      numBehaviors
    )}`
  );
  ColorPrinter.blankLine();
  for (var i = 0; i < behaviors.length; ++i) {
    updateBehaviorMetadata(behaviors[i], behaviorMetadata);
  }
  await serializeMetadata(opts, behaviorMetadata);
}

module.exports = {
  buildingWhat,
  createRunnableBehavior,
  createRunnableBehaviorInBuildDir,
  createRunnableBehaviors,
  createRunnerConfig,
  generateMetdataFile,
  initRunnableBehavior,
  updateBehaviorMetadata,
  watch,
  resolveWhatPath,
};
