const __camelCaseRe = /(-|_|\s)+(.)?/g;
const __camelCaseReplacer = (match, sep, c) => (c ? c.toUpperCase() : '');

export function camelCase(str) {
  return str.replace(__camelCaseRe, __camelCaseReplacer);
}

/**
 *
 * @param {string} str
 * @return {string}
 */
export function capitalize(str) {
  return str.substr(0, 1).toUpperCase() + str.substring(1).toLowerCase();
}

const __ccToDashDelimRe1 = /[_\s]+/g;
const __ccToDashDelimRe2 = /([A-Z])/g;
const __ccToDashDelimRe3 = /-+/g;

/**
 *
 * @param {?string} str
 * @return {?string}
 */
export function camelCaseToDashDelim(str) {
  if (str) {
    return str
      .trim()
      .replace(__ccToDashDelimRe1, '-')
      .replace(__ccToDashDelimRe2, '-$1')
      .replace(__ccToDashDelimRe3, '-')
      .toLowerCase();
  }
  return str;
}

const __ccToUnderDelimRe1 = /([a-z\d])([A-Z]+)/g;
const __ccToUnderDelimRe2 = /([A-Z\d]+)([A-Z][a-z])/g;
const __ccToUnderDelimRe3 = /[-\s]+/g;

/**
 *
 * @param {?string} str
 * @return {?string}
 */
export function camelCaseToUnderscoreDelim(str) {
  if (str) {
    str
      .trim()
      .replace(__ccToUnderDelimRe1, '$1_$2')
      .replace(__ccToUnderDelimRe2, '$1_$2')
      .replace(__ccToUnderDelimRe3, '_')
      .toLowerCase();
  }
  return str;
}

const __titleCaseRe = /(^[a-z]| [a-z]|-[a-z]|_[a-z])/g;
const __titleCaseReplacer = value => value.toUpperCase();

/**
 *
 * @param {?string} str
 * @return {?string}
 */
export function titleCase(str) {
  if (str) {
    return str.replace(__titleCaseRe, __titleCaseReplacer);
  }
  return str;
}

const __collapseWhitespaceRe1 = /[\s\xa0]+/g;
const __collapseWhitespaceRe2 = /^\s+|\s+$/g;

/**
 *
 * @param {?string} str
 * @return {?string}
 */
export function collapseWhitespace(str) {
  return str
    .replace(__collapseWhitespaceRe1, ' ')
    .replace(__collapseWhitespaceRe2, '');
}

export function stringBetween(str, left, right) {
  const startPos = str.indexOf(left);
  const endPos = str.indexOf(right, startPos + left.length);
  if (endPos === -1 && right != null) {
    return '';
  } else if (endPos === -1 && right == null) {
    return str.substring(startPos + left.length);
  }
  return str.slice(startPos + left.length, endPos);
}

const __isAlphaRe = /[^a-z\xDF-\xFF]|^$/;

/**
 *
 * @param {?string} str
 * @return {boolean}
 */
export function isAlpha(str) {
  if (str) {
    return !__isAlphaRe.test(str.toLowerCase());
  }
  return false;
}

const __isAlphaNumericRe = /[^0-9a-z\xDF-\xFF]/;

/**
 *
 * @param {?string} str
 * @return {boolean}
 */
export function isAlphaNumeric(str) {
  if (str) {
    return !__isAlphaNumericRe.test(str.toLowerCase());
  }
  return false;
}

const __isEmptyRe = /^[\s\xa0]*$/;

/**
 *
 * @param {?string} str
 * @return {boolean}
 */
export function isEmptyString(str) {
  return str == null ? true : __isEmptyRe.test(str);
}

/**
 *
 * @param {string} str
 * @return {boolean}
 */
export function isLower(str) {
  return isAlpha(str) && str.toLowerCase() === str;
}

const __isNumericRe = /[^0-9]/;

/**
 *
 * @param {?string} str
 * @return {boolean}
 */
export function isNumeric(str) {
  return str != null ? !__isNumericRe.test(str) : false;
}

/**
 *
 * @param {?string} str
 * @return {boolean}
 */
export function isUpper(str) {
  return isAlpha(str) && str.toUpperCase() === str;
}

/**
 *
 * @param {string|boolean|number} str
 * @return {boolean}
 */
export function toBoolean(str) {
  if (typeof str === 'string') {
    const s = str.toLowerCase();
    return s === 'true' || s === 'yes' || s === 'on' || s === '1';
  }
  return str === true || str === 1;
}

/**
 *
 * @param {string} str
 * @param {number} [precision]
 * @return {number}
 */
export function toFloat(str, precision) {
  const num = parseFloat(str);
  if (precision) {
    return parseFloat(num.toFixed(precision));
  }
  return num;
}

/**
 *
 * @param {string} str
 * @param {number} [base = 10]
 * @return {number}
 */
export function toInt(str, base = 10) {
  return parseInt(str, base);
}

/**
 * @param {string} str
 * @param {string} needle
 * @param {SubstringArgs} [opts]
 * @return {string}
 */
export function substringFromLastIndexOf(
  str,
  needle,
  { searchFrom, include } = {}
) {
  const idx = str.lastIndexOf(needle, searchFrom);
  return str.substring(idx + (include ? 0 : needle.length));
}

/**
 * @param {string} str
 * @param {string} needle
 * @param {SubstringArgs} [opts]
 * @return {string}
 */
export function substringFromIndexOf(
  str,
  needle,
  { searchFrom, include } = {}
) {
  const idx = str.indexOf(needle, searchFrom);
  return str.substring(idx + (include ? 0 : needle.length));
}

/**
 * @typedef {Object} SubstringArgs
 * @property {number} [searchFrom]
 * @property {boolean} [include]
 **/
