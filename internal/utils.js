const util = require('util');
const prettyTime = require('pretty-time');

const behaviorKinds = {
  behavior: Symbol('source-file-behavior'),
  notABehavior: Symbol('source-not-a-behavior'),
  maybeBehaviorMetaDataOnly: Symbol('source-maybe-behavior-metadata-only'),
  maybeBehaviorSentinelOnly: Symbol('source-maybe-behavior-sentinel-only'),
};

const defaultInspectOpts = {
  depth: null,
  compact: false,
  breakLength: Infinity,
};

class Utils {
  /**
   * Returns the symbol for the metadata export if it exists from the supplied
   * source files symbol
   * @param moduleSymbol
   */
  static getMdataSymbol(moduleSymbol) {
    return (
      moduleSymbol.getExport('metadata') || moduleSymbol.getExport('metaData')
    );
  }

  /**
   * Determines if the supplied source file is for a behavior or not
   * @param {SourceFile} sourceFile
   * @return {boolean} - The results of the is behavior check
   */
  static isBehavior(sourceFile) {
    const moduleSymbol = sourceFile.getSymbol();
    if (moduleSymbol == null) return false;
    return (
      Utils.getMdataSymbol(moduleSymbol) != null &&
      moduleSymbol.getExport('isBehavior') != null
    );
  }

  static behaviorKind(sourceFile) {
    const moduleSymbol = sourceFile.getSymbol();
    if (moduleSymbol == null) return behaviorKinds.notABehavior;
    const metaDataSymbol = Utils.getMdataSymbol(moduleSymbol);
    const isBehaviorSymbol = moduleSymbol.getExport('isBehavior');
    if (metaDataSymbol != null && isBehaviorSymbol != null) {
      return behaviorKinds.behavior;
    }
    if (metaDataSymbol != null && isBehaviorSymbol == null) {
      return behaviorKinds.maybeBehaviorMetaDataOnly;
    }
    if (metaDataSymbol == null && isBehaviorSymbol != null) {
      return behaviorKinds.maybeBehaviorSentinelOnly;
    }
    return behaviorKinds.notABehavior;
  }

  /**
   *
   * @param {Array<number>} startTime
   * @return {string}
   */
  static timeDiff(startTime) {
    return prettyTime(process.hrtime(startTime), 'ms');
  }

  /**
   * @param {*} object
   * @return {boolean}
   */
  static isObject(object) {
    return typeof object === 'object';
  }

  /**
   * @param {string|RegExp} object
   * @return {string}
   */
  static regexSource(object) {
    return object instanceof RegExp ? object.source : object;
  }

  /**
   * @param {*} obj
   * @return {boolean}
   */
  static isString(obj) {
    return typeof obj === 'string' || obj instanceof String;
  }

  /**
   * @param {*} obj
   * @return {boolean}
   */
  static isRegex(obj) {
    return obj instanceof RegExp;
  }

  /**
   * @param {*} obj
   * @return {boolean}
   */
  static isStringOrRegex(obj) {
    return Utils.isString(obj) || Utils.isRegex(obj);
  }

  /**
   * @param {?Object} obj
   * @return {boolean}
   */
  static isBoolean(obj) {
    return typeof obj === 'boolean' || obj instanceof Boolean;
  }

  /**
   *
   * @param {string} filePath
   * @return {string}
   */
  static ensureJsFileExt(filePath) {
    if (!filePath.endsWith('.js')) return `${filePath}.js`;
    return filePath;
  }

  static upperFirst(str, idx) {
    if (idx != null) {
      return idx !== 0
        ? str.substring(0, 1).toUpperCase() + str.substring(1)
        : str;
    }
    return str.substring(0, 1).toUpperCase() + str.substring(1);
  }

  /**
   *
   * @param {*} obj
   * @param {Object} [opts]
   * @return {string}
   */
  static inspect(obj, opts) {
    return util.inspect(
      obj,
      opts != null
        ? Object.assign({}, defaultInspectOpts, opts)
        : defaultInspectOpts
    );
  }

  /**
   *
   * @param {...string} msgs
   * @return {string}
   */
  static joinStrings(...msgs) {
    if (msgs.length === 1) {
      return msgs[0];
    }
    return Utils.stringifyArray(msgs);
  }

  /**
   *
   * @param {Array<*>} array
   * @param {string} [joiner]
   */
  static stringifyArray(array, joiner) {
    return array.join(joiner != null ? joiner : '\n');
  }

  /**
   *
   * @param {number} num
   * @return {string}
   */
  static numberOrdinalSuffix(num) {
    let j = num % 10;
    let k = num % 100;
    if (j === 1 && k !== 11) {
      return `${num}st`;
    } else if (j === 2 && k !== 12) {
      return `${num}nd`;
    } else if (j === 3 && k !== 13) {
      return `${num}rd`;
    }
    return `${num}th`;
  }

  static envFlagToBool(envKey) {
    if (envKey == null) return false;
    switch (envKey) {
      case 'n':
      case 'no':
      case '0':
      case 'false':
        return false;
      case 'y':
      case 'yes':
      case '1':
      case 'true':
        return true;
    }
    return false;
  }
}

Utils.behaviorKinds = behaviorKinds;

module.exports = Utils;
