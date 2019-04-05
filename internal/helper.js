const Util = require('util');

class Helper {
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
    return Helper.isString(obj) || Helper.isRegex(obj);
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
    return Util.inspect(
      obj,
      Object.assign({ depth: null, compact: false }, opts)
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
    return Helper.stringifyArray(msgs);
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
}

/**
 *
 * @type {Helper}
 */
module.exports = Helper;
