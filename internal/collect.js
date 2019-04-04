const { Project } = require('ts-morph');
const ColorPrinter = require('./colorPrinter');
const Behavior = require('./behavior');
const Reporter = require('./reporter');
const Utils = require('./utils');

const isBehaviorResults = Utils.isBehaviorResults;

class Collect {
  /**
   * @desc Collects all behaviors from a directory
   * @param {CollectionOptions} opts
   * @return {Array<Behavior>}
   */
  static behaviorsFromDir(opts) {
    const startTime = process.hrtime();
    const project = opts.project;

    ColorPrinter.info('Collecting the behaviors');
    project.addExistingDirectory(opts.dir, { recursive: true });
    project.resolveSourceFileDependencies();

    const typeChecker = project.getTypeChecker();
    const dir = project.getDirectory(opts.dir);
    const sourceFiles = dir.getDescendantSourceFiles();
    let numNonBehaviors = 0;
    let numOnlySentinel = 0;
    let numOnlyMetadata = 0;

    /** @type {Array<Behavior>} */
    const behaviors = [];
    for (var i = 0; i < sourceFiles.length; i++) {
      switch (Utils.isBehavior(sourceFiles[i])) {
        case isBehaviorResults.behavior:
          behaviors.push(
            new Behavior({ file: sourceFiles[i], typeChecker, opts })
          );
          break;
        case isBehaviorResults.notABehavior:
          numNonBehaviors++;
          break;
        case isBehaviorResults.maybeBehaviorSentinelOnly:
          numOnlySentinel++;
          ColorPrinter.error(
            `Found file that ${ColorPrinter.chalk.redBright(
              'only exports the "isBehavior" sentinel'
            )}: ${sourceFiles[i].getFilePath()}`
          );
          break;
        case isBehaviorResults.maybeBehaviorMetaDataOnly:
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
      numNonBehaviors
    });

    return behaviors;
  }

  /**
   * @desc Collects a behaviors from a file
   * @param {CollectionOptions} opts
   * @return {?Behavior}
   */
  static behaviorFromFile(opts) {
    const startTime = process.hrtime();
    const project = opts.project;

    ColorPrinter.info('Collecting the behavior');
    project.addExistingSourceFile(opts.file);
    project.resolveSourceFileDependencies();

    const typeChecker = project.getTypeChecker();
    const sourceFile = project.getSourceFile(opts.file);
    const isBehaviorCheckResults = isBehavior(sourceFile);

    let behavior;
    if (isBehaviorCheckResults === isBehaviorResults.behavior) {
      behavior = new Behavior({ file: sourceFile, typeChecker, opts });
    }

    Reporter.collectedBehaviorFromFileReport({
      result: isBehaviorCheckResults,
      time: Utils.timeDiff(startTime),
      fileName: sourceFile.getBaseName()
    });

    return behavior;
  }
}

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

module.exports = Collect;
