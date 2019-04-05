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

function initRunnableBehavior({ dImport, postStep, behaviorP, libP }) {
  let behaviorImport;
  if (postStep) {
    behaviorImport = `import ${dImport}, {${postStep}} from '${ensureNoBehaviorPJsExt(
      behaviorP
    )}';`;
  } else {
    behaviorImport = `import ${dImport} from '${ensureNoBehaviorPJsExt(
      behaviorP
    )}';`;
  }
  const initImport = `${behaviorImport}
import { maybePolyfillXPG, initRunnableBehavior } from '${libP}';`;

  let init;
  if (postStep) {
    init = `initRunnableBehavior(window, ${dImport}(cliAPI), ${postStep});`;
  } else {
    init = `initRunnableBehavior(window, ${dImport}(cliAPI));`;
  }

  const code = `${initImport}

cliAPI.$x = maybePolyfillXPG(cliAPI.$x);

${init}
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
  let exists;

  if (Utils.isBoolean(opts.what)) {
    exists = await fs.pathExists(opts.behaviorDir);
    if (!exists) {
      throw new Error(
        `${operation} failed because the behavior directory does not exist: ${
          opts.behaviorDir
        }`
      );
    }
    return opts.behaviorDir;
  }

  if (Path.isAbsolute(opts.what)) {
    exists = await fs.pathExists(opts.what);
    if (!exists) {
      throw new Error(
        `${operation} failed because the behavior(s) path ${
          opts.what
        } does not exist`
      );
    }
    return opts.what;
  }

  const relResolvedWhat = Path.resolve(opts.what);
  exists = await fs.pathExists(relResolvedWhat);
  if (exists) return relResolvedWhat;

  const behaviorDirPlusWhat = Path.join(opts.behaviorDir, opts.what);
  exists = await fs.pathExists(behaviorDirPlusWhat);
  if (exists) return behaviorDirPlusWhat;

  const cwdPlusWhat = Path.join(process.cwd(), opts.what);
  exists = await fs.pathExists(cwdPlusWhat);
  if (exists) return cwdPlusWhat;

  const behaviorDirPlusRelResolvedWhat = Path.join(
    opts.behaviorDir,
    relResolvedWhat
  );
  exists = await fs.pathExists(behaviorDirPlusRelResolvedWhat);
  if (exists) return behaviorDirPlusRelResolvedWhat;

  const cwdPlusRelResolvedWhat = Path.join(process.cwd(), relResolvedWhat);
  exists = await fs.pathExists(cwdPlusRelResolvedWhat);
  if (exists) return cwdPlusRelResolvedWhat;

  throw new Error(
    Utils.joinStrings(
      `${operation} failed because the behavior(s) path ${
        opts.what
      } does not exist and we tried the following paths:`,
      relResolvedWhat,
      behaviorDirPlusWhat,
      cwdPlusWhat,
      behaviorDirPlusRelResolvedWhat,
      cwdPlusRelResolvedWhat
    )
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
      path: resolvedWhat
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
  const mdata = Object.assign({}, behavior.metadata, {
    fileName: behavior.buildFileName
  });
  if (behavior.isDefaultBehavior) {
    behaviorMetadata.defaultBehavior = mdata;
  } else {
    behaviorMetadata.behaviors.push(mdata);
  }
}

class Build {
  /**
   * Creates runnable behavior(s) for either a directory containing behaviors
   * or a single behavior
   * @param {Config} opts - The behavior config
   * @return {Promise<void>}
   */
  static async createRunnableBehaviors(opts) {
    const totalTime = process.hrtime();
    const project = new Project({ tsConfigFilePath: opts.tsConfigFilePath });
    const resolvedWhat = await buildingWhat(
      opts,
      'Creation of runnable behaviors'
    );
    await fs.ensureDir(opts.buildDir);
    await fs.ensureDir(opts.distDir);
    if (resolvedWhat.isDir) {
      ColorPrinter.info(
        `Creating runnable behaviors for all behaviors found in the directory located at ${
          resolvedWhat.path
        }`
      );
      ColorPrinter.blankLine();
      const finalOpts = Object.assign(
        {
          project: project,
          dir: resolvedWhat.path
        },
        opts
      );
      const behaviors = Collect.behaviorsFromDir(finalOpts);
      const numBehaviors = behaviors.length;
      const behaviorMetadata = {
        defaultBehavior: {},
        behaviors: []
      };
      let i = behaviors.length;
      ColorPrinter.blankLine();
      ColorPrinter.info(
        `Creating ${numBehaviors} runnable ${plur('behavior', numBehaviors)}`
      );
      ColorPrinter.blankLine();
      const createBuildStartTime = process.hrtime();
      while (i--) {
        await Build.createRunnableBehavior(behaviors[i], finalOpts);
        updateBehaviorMetadata(behaviors[i], behaviorMetadata);
        ColorPrinter.blankLine();
      }
      ColorPrinter.info(
        `Created ${numBehaviors} runnable ${plur(
          'behavior',
          numBehaviors
        )} in ${Utils.timeDiff(createBuildStartTime)}`
      );
      const buildMetadataStartTime = process.hrtime();
      let metadataFilePath;
      if (opts.metadata.endsWith('.js')) {
        metadataFilePath = opts.metadata;
      } else {
        metadataFilePath = Path.join(opts.metadata, 'behaviorMetadata.js');
      }
      const safeString = Utils.inspect(behaviorMetadata);
      await fs.writeFile(metadataFilePath, `module.exports = ${safeString};`);
      ColorPrinter.info(
        `Metadata created in ${Utils.timeDiff(
          buildMetadataStartTime
        )} and can be found at ${metadataFilePath}`
      );
      ColorPrinter.info(`Total time: ${Utils.timeDiff(totalTime)}`);
      return;
    }
    ColorPrinter.info(
      `Creating runnable behaviors for the behavior located at ${
        resolvedWhat.path
      }`
    );
    ColorPrinter.blankLine();
    const finalOpts = Object.assign(
      {
        project: project,
        file: resolvedWhat.path
      },
      opts
    );
    const behavior = Collect.behaviorFromFile(finalOpts);
    if (!behavior) return;
    await Build.createRunnableBehavior(behavior, finalOpts);
    ColorPrinter.info(`Total time: ${Utils.timeDiff(totalTime)}`);
  }

  /**
   * Creates a runnable behavior for the supplied behavior
   * @param {Behavior} behavior - The behavior to create a runnable file for
   * @param {Config} opts - The behavior config
   * @return {Promise<undefined>}
   */
  static async createRunnableBehavior(behavior, opts) {
    const startTime = process.hrtime();
    behavior.init();
    const buildFileName = behavior.buildFileName;
    ColorPrinter.info(`Creating runnable behavior for ${buildFileName}`);
    let runnablePath;
    if (behavior.checkStateGood) {
      let code;
      if (behavior.hasPostStep) {
        code = initRunnableBehavior({
          dImport: behavior.importName,
          libP: opts.libDir,
          behaviorP: behavior.importPathRelativeToBuildDir,
          postStep: 'postStep'
        });
      } else {
        code = initRunnableBehavior({
          dImport: behavior.importName,
          libP: opts.libDir,
          behaviorP: behavior.importPathRelativeToBuildDir
        });
      }
      runnablePath = behavior.filePathInBuildDir;
      await fs.writeFile(runnablePath, code, 'utf8');
    } else {
      runnablePath = behavior.filePathInBuildDir;
      await fs.copy(behavior.path, behavior.filePathInBuildDir, {
        overwrite: true
      });
    }
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
    let error;
    const buildStartTime = process.hrtime();
    try {
      const bundle = await rollup.rollup(inConf);
      await bundle.write(outConf);
    } catch (e) {
      error = e;
    }
    if (error) {
      ColorPrinter.showError(
        `Could not build the runnable behavior found at ${runnablePath}`,
        error
      );
      return;
    }
    ColorPrinter.info(
      `Runnable behavior built in ${Utils.timeDiff(
        buildStartTime
      )}: ${runnablePath} -> ${runnableDistPath}`
    );
  }

  /**
   * Watches the behaviors for changes and rebuilds them on a change
   * @param {Config} config - The behavior config
   * @return {Promise<void>}
   */
  static async watch(config) {
    let watcher;
    const resolvedWhat = await buildingWhat(
      opts,
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
                alwaysStat: true
              }
            }
          };
        })
      );
    } else {
      const filePath = resolvedWhat.path;
      const outPath = Path.join(
        config.distDir,
        Path.basename(resolvedWhat.path)
      );
      const inoutConf = makeInputOutputConfig(filePath, outPath);
      watcher = rollup.watch({
        ...inoutConf.inConf,
        output: inoutConf.outConf,
        watch: {
          chokidar: {
            usePolling: process.platform !== 'darwin',
            alwaysStat: true
          }
        }
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
  static async generateMetdataFile(opts) {
    const project = new Project({ tsConfigFilePath: opts.tsConfigFilePath });
    const resolvedWhat = await buildingWhat(opts, 'Generating metadata file');

    if (!resolvedWhat.isDir) {
      ColorPrinter.error('Can only create the metadata file for all behaviors');
      return;
    }

    ColorPrinter.info(
      `Creating runnable behaviors for all behaviors found in the directory located at ${
        resolvedWhat.path
      }`
    );
    ColorPrinter.blankLine();
    const finalOpts = Object.assign(
      {
        project: project,
        dir: resolvedWhat.path
      },
      opts
    );
    const behaviors = Collect.behaviorsFromDir(finalOpts);
    const numBehaviors = behaviors.length;
    const behaviorMetadata = {
      defaultBehavior: {},
      behaviors: []
    };
    let i = behaviors.length;
    ColorPrinter.blankLine();
    ColorPrinter.info(
      `Creating the metadata file for ${numBehaviors} ${plur(
        'behavior',
        numBehaviors
      )}`
    );
    ColorPrinter.blankLine();
    while (i--) {
      updateBehaviorMetadata(behaviors[i], behaviorMetadata);
    }
    const buildMetadataStartTime = process.hrtime();
    let metadataFilePath;
    if (opts.metadata.endsWith('.js')) {
      metadataFilePath = opts.metadata;
    } else {
      metadataFilePath = Path.join(opts.metadata, 'behaviorMetadata.js');
    }
    const safeString = Utils.inspect(behaviorMetadata, {
      depth: null,
      compact: false
    });
    await fs.writeFile(metadataFilePath, `module.exports = ${safeString};`);
    ColorPrinter.info(
      `Metadata created in ${Utils.timeDiff(
        buildMetadataStartTime
      )} and can be found at ${metadataFilePath}`
    );
  }
}

module.exports = Build;
