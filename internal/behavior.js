const Path = require('path');
const util = require('util');
const { SourceFile, TypeChecker } = require('ts-morph');
const Checking = require('./checking');
const ColorPrinter = require('./colorPrinter');
const { CheckState } = require('./states');
const Utils = require('./utils');

class Behavior {
  /**
   * @param {{file: SourceFile, typeChecker: TypeChecker, opts: Object}}
   */
  constructor({ file, typeChecker, opts }) {
    /**
     * @type {Object}
     */
    this._opts = opts;

    /**
     * @type {SourceFile}
     */
    this._file = file;

    /**
     * @type {TypeChecker}
     */
    this._typeChecker = typeChecker;

    /**
     * @type {boolean}
     * @private
     */
    this._hasPostStep = false;

    /**
     * @type {?string}
     * @private
     */
    this._buildFileName = null;

    /**
     * @type {symbol}
     */
    this._checkState = CheckState.notChecked;

    /**
     *
     * @type {{exportType: ?symbol, name: ?string}}
     * @private
     */
    this._defaultExport = {
      name: null,
      exportType: null
    };

    this._checkedMetadata = {
      checkState: null,
      errorMsg: null,
      value: null
    };

    /**
     * @type {boolean}
     * @private
     */
    this._didInit = false;
  }

  printCheckReport(brief) {
    this.init();
    switch (this._checkState) {
      case CheckState.good:
        break;
      case CheckState.fileNotModule:
        ColorPrinter.error(
          `The behavior located at ${this.path} is not a "module"`,
          'Did you forget to follow the expected behavior format?\n'
        );
        if (!brief) {
        }
        break;
      case CheckState.bad:
        break;
      case CheckState.noDefaultExport:
        break;
    }
  }

  /**
   * @desc Perform the validation and discovery of the behaviors default export
   * symbol and find out if this behavior exports a postStep function
   */
  init() {
    if (this._didInit) {
      return;
    }
    this._didInit = true;
    const checkResults = Checking.checkBehaviorsSourceFile(
      this._file,
      this._typeChecker
    );
    this._checkState = checkResults.state;
    this._hasPostStep = checkResults.hasPostStep;
    if (checkResults.metadata) {
      this._checkedMetadata = checkResults.metadata;
    }
    if (checkResults.defaultExport) {
      this._defaultExport.name = checkResults.defaultExport.name;
      this._defaultExport.exportType = checkResults.defaultExport.exportType;
    }
  }

  /**
   * Returns T/F indicating if the behavior has valid metadata
   * @return {boolean}
   */
  get hasValidMetadata() {
    return this._checkedMetadata.checkState === CheckState.good;
  }

  /**
   * Returns T/F indicating if the behavior supplies its own post step function
   * @return {boolean}
   */
  get hasPostStep() {
    return this._hasPostStep;
  }

  /**
   * Returns the name behavior used when the behavior is imported in the build file
   * @return {string}
   */
  get importName() {
    if (this._checkedMetadata.name) return this._checkedMetadata.name;
    if (this._defaultExport.name) return this._defaultExport.name;
    return 'behavior';
  }

  /**
   * Returns T/F indicating if the behavior is ok
   * @return {boolean}
   */
  get checkStateGood() {
    return this._checkState === CheckState.good;
  }

  /**
   *
   * @return {symbol}
   */
  get checkState() {
    return this._checkState;
  }

  /**
   *
   * @return {?symbol}
   */
  get exportType() {
    return this._defaultExport.exportType;
  }

  /**
   * @desc Returns the filename of this behavior
   * @return {string}
   */
  get fileName() {
    return this._file.getBaseName();
  }

  /**
   * Returns the file name for the behaviors build file
   * @return {string}
   */
  get buildFileName() {
    if (this._buildFileName) {
      return this._buildFileName;
    }
    let fileName;
    const rootBehaviorDirPath = this._opts.dir;
    const containingDirPath = this._file.getDirectoryPath();
    if (rootBehaviorDirPath === containingDirPath) {
      fileName = this.fileName;
      this._buildFileName = fileName.toLowerCase().endsWith('behavior.js')
        ? fileName
        : `${Path.basename(fileName, '.js')}Behavior.js`;
    } else {
      fileName = this._file
        .getFilePath()
        .substring(
          containingDirPath.indexOf(rootBehaviorDirPath) +
            rootBehaviorDirPath.length +
            1
        )
        .split(Path.sep)
        .map(Utils.upperFirst)
        .join('');
      this._buildFileName = fileName.toLowerCase().endsWith('behavior.js')
        ? fileName
        : `${Path.basename(fileName, '.js')}Behavior.js`;
    }
    return this._buildFileName;
  }

  /**
   * @desc Returns the absolute path to this behavior
   * @return {string}
   */
  get path() {
    return this._file.getFilePath();
  }

  /**
   * @desc Returns the absolute path to this behaviors containing directory
   * @return {string}
   */
  get dirPath() {
    return this._file.getDirectoryPath();
  }

  /**
   * @desc Returns this behaviors import path relative the to collectors
   * build directory
   * @return {string}
   */
  get importPathRelativeToBuildDir() {
    return Path.relative(this._opts.buildDir, this.path);
  }

  /**
   * Returns the path to the behavior in the build directory
   * @return {string}
   */
  get filePathInBuildDir() {
    return Path.join(this._opts.buildDir, this.buildFileName);
  }

  /**
   * Returns T/F indication if the behavior is the default behavior
   * @return {boolean}
   */
  get isDefaultBehavior() {
    return !!(
      this._checkedMetadata.value &&
      this._checkedMetadata.value.defaultBehavior
    );
  }

  /**
   * Returns the behaviors metadata validation error message
   * @return {?string}
   */
  get getMetadataValidationErrorMsg() {
    return this._checkedMetadata.errorMsg;
  }

  /**
   * Returns the behaviors metadata
   * @return {?Object}
   */
  get metadata() {
    return this._checkedMetadata.value;
  }

  [util.inspect.custom](depth, options) {
    if (depth < 0) {
      return options.stylize('[BehaviorFile]', 'special');
    }
    const newOptions = Object.assign({}, options, {
      depth: options.depth === null ? null : options.depth - 1
    });
    const inspectable = {
      path: this.path,
      fileName: this.fileName,
      checkState: this._checkState,
      hasPostStep: this._hasPostStep,
      defaultExport: this._defaultExport,
      metadata: this.metadata
    };
    const inner = util.inspect(inspectable, newOptions);
    return `${options.stylize('BehaviorFile', 'special')} ${inner}`;
  }
}

module.exports = Behavior;
