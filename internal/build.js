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

const makePretty = code => prettier.format(code, prettierOpts);

const ensureNoBehaviorPJsExt = behaviorP => {
  if (behaviorP.endsWith('.js')) {
    return behaviorP.substring(0, behaviorP.indexOf('.js'));
  }
  return behaviorP;
};

/**
 *
 * @param {{ dImport: string, behaviorP: string, libP: string }} initNames
 * @return {string}
 */
const behaviorJsNoPoststep = ({ dImport, behaviorP, libP }) => {
  const code = `import ${dImport} from '${ensureNoBehaviorPJsExt(behaviorP)}';
import { maybePolyfillXPG, initRunnableBehavior } from '${libP}';

initRunnableBehavior(window, ${dImport}(maybePolyfillXPG(xpg)));
`;
  return makePretty(code);
};

/**
 *
 * @param {{ dImport: string, postStep: string, behaviorP: string, libP: string }} initNames
 * @return {string}
 */
const behaviorJsPoststep = ({ dImport, postStep, behaviorP, libP }) => {
  const code = `import ${dImport}, {${postStep}} from '${ensureNoBehaviorPJsExt(
    behaviorP
  )}';
import { maybePolyfillXPG, initRunnableBehavior } from '${libP}';
  
initRunnableBehavior(window, ${dImport}(maybePolyfillXPG(xpg)), ${postStep});
`;
  return makePretty(code);
};

/**
 * @param {Config} opts
 * @param {string} operation
 * @return {Promise<string|boolean>}
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
 *
 * @param {Config} opts
 * @param {string} operation
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
 *
 * @param {Behavior} behavior
 * @param {{defaultBehavior: Object, behaviors: Array<Object>}} behaviorMetadata
 */
function updateBehaviorMetadata(behavior, behaviorMetadata) {
  if (behavior.isDefaultBehavior) {
    behaviorMetadata.defaultBehavior = Object.assign({}, behavior.metadata, {
      name: behavior.buildFileName
    });
  } else {
    behaviorMetadata.behaviors.push(
      Object.assign({}, behavior.metadata, {
        name: behavior.buildFileName
      })
    );
  }
}

class Build {
  /**
   *
   * @param {Config} opts
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
   *
   * @param {Behavior} behavior
   * @param {Object} opts
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
        code = behaviorJsPoststep({
          dImport: behavior.importName,
          libP: opts.libDir,
          behaviorP: behavior.importPathRelativeToBuildDir,
          postStep: 'postStep'
        });
      } else {
        code = behaviorJsNoPoststep({
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

  static async generateMetdataFile(config) {
    const totalTime = process.hrtime();
    const project = new Project({ tsConfigFilePath: opts.tsConfigFilePath });
    const resolvedWhat = await buildingWhat(opts, 'Generating metadata file');
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
      return;
    }
    ColorPrinter.error('Can only create the metadata file for all behaviors');
  }
}

/**
 * @type {Build}
 */
module.exports = Build;
