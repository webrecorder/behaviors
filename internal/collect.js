const { Project } = require('ts-morph');
const ColorPrinter = require('./colorPrinter');
const Behavior = require('./behavior');
const Reporter = require('./reporter');
const Utils = require('./utils');


exports.behaviorsFromDirIterator = function* behaviorsFromDirIterator(opts) {
  const project = opts.project;
  project.addExistingDirectory(opts.dir, { recursive: true });
  project.resolveSourceFileDependencies();
  const typeChecker = project.getTypeChecker();
  let directories = [project.getDirectory(opts.dir)];
  let nextDir;
  let sourceFiles;
  let sourceFile;
  let i;
  while (directories.length) {
    nextDir = directories.shift();
    sourceFiles = nextDir.getSourceFiles();
    for (i = 0; i < sourceFiles.length; i++) {
      sourceFile = sourceFiles[i];
      if (Utils.isBehavior(sourceFile)) {
        yield new Behavior({ file: sourceFile, typeChecker, opts });
      }
    }
    directories = directories.concat(nextDir.getDirectories())
  }
};

/**
 * @desc Collects all behaviors from a directory
 * @param {CollectionOptions} opts
 * @return {Array<Behavior>}
 */
exports.behaviorsFromDir = function behaviorsFromDir(opts) {
  const startTime = process.hrtime();
  const project = opts.project;

  ColorPrinter.info('Collecting the behaviors');
  project.addExistingDirectory(opts.dir, { recursive: true });
  project.resolveSourceFileDependencies();

  const typeChecker = project.getTypeChecker();
  const dir = project.getDirectory(opts.dir);
  const sourceFiles = dir.getDescendantSourceFiles();
  const behaviorKinds = Utils.behaviorKinds;
  let numNonBehaviors = 0;
  let numOnlySentinel = 0;
  let numOnlyMetadata = 0;

  /** @type {Array<Behavior>} */
  const behaviors = [];
  for (var i = 0; i < sourceFiles.length; i++) {
    switch (Utils.behaviorKind(sourceFiles[i])) {
      case behaviorKinds.behavior:
        behaviors.push(
          new Behavior({ file: sourceFiles[i], typeChecker, opts })
        );
        break;
      case behaviorKinds.notABehavior:
        numNonBehaviors++;
        break;
      case behaviorKinds.maybeBehaviorSentinelOnly:
        numOnlySentinel++;
        ColorPrinter.error(
          `Found file that ${ColorPrinter.chalk.redBright(
            'only exports the "isBehavior" sentinel'
          )}: ${sourceFiles[i].getFilePath()}`
        );
        break;
      case behaviorKinds.maybeBehaviorMetaDataOnly:
        numOnlyMetadata++;
        ColorPrinter.error(
          `Found file that ${ColorPrinter.chalk.redBright(
            'only exports metadata'
          )}: ${sourceFiles[i].getFilePath()}`
        );
        break;
    }
  }

  Reporter.collectedBehaviorsFromDirReport({
    time: Utils.timeDiff(startTime),
    numBehaviors: behaviors.length,
    numOnlyMetadata,
    numOnlySentinel,
    numNonBehaviors,
  });

  return behaviors;
};

/**
 * @desc Collects a behaviors from a file
 * @param {CollectionOptions} opts
 * @return {?Behavior}
 */
exports.behaviorFromFile = function behaviorFromFile(opts) {
  const startTime = process.hrtime();
  const project = opts.project;

  ColorPrinter.info('Collecting the behavior');
  project.addExistingSourceFile(opts.file);
  project.resolveSourceFileDependencies();

  const typeChecker = project.getTypeChecker();
  const sourceFile = project.getSourceFile(opts.file);
  const isBehaviorCheckResults = Utils.behaviorKind(sourceFile);
  Reporter.collectedBehaviorFromFileReport({
    result: isBehaviorCheckResults,
    time: Utils.timeDiff(startTime),
    fileName: sourceFile.getBaseName(),
  });
  if (isBehaviorCheckResults === Utils.behaviorKinds.behavior) {
    return new Behavior({ file: sourceFile, typeChecker, opts });
  }

  return null;
};

/**
 * @typedef {Object} CollectionOptions
 * @property {Project} project
 * @property {string} behaviorDir
 * @property {string} libDir
 * @property {string} buildDir
 * @property {string} distDir
 * @property {?string} [dir]
 * @property {?string} [file]
 * @property {?string} [metadata]
 */
