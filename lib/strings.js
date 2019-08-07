/** @ignore */
const __camelCaseRe = /(-|_|\s)+(.)?/g;
/** @ignore */
const __camelCaseReplacer = (match, sep, c) => (c ? c.toUpperCase() : '');

/**
 * Attempts to convert the supplied string into camel case
 * @param {string} str
 * @return {string}
 */
export function camelCase(str) {
  return str.replace(__camelCaseRe, __camelCaseReplacer);
}

/**
 * Attempts to capitalize the supplied string
 * @param {string} str
 * @return {string}
 */
export function capitalize(str) {
  return str.substr(0, 1).toUpperCase() + str.substring(1).toLowerCase();
}

/** @ignore */
const __ccToDashDelimRe1 = /[_\s]+/g;
/** @ignore */
const __ccToDashDelimRe2 = /([A-Z])/g;
/** @ignore */
const __ccToDashDelimRe3 = /-+/g;

/**
 * Attempts to convert the supplied camel case string into dash delimited string
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

/** @ignore */
const __ccToUnderDelimRe1 = /([a-z\d])([A-Z]+)/g;
/** @ignore */
const __ccToUnderDelimRe2 = /([A-Z\d]+)([A-Z][a-z])/g;
/** @ignore */
const __ccToUnderDelimRe3 = /[-\s]+/g;

/**
 * Attempts to convert the supplied camel case string into an underscore delimited string
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

/** @ignore */
const __titleCaseRe = /(^[a-z]| [a-z]|-[a-z]|_[a-z])/g;
/** @ignore */
const __titleCaseReplacer = value => value.toUpperCase();

/**
 * Attempts to convert the supplied string into title case
 * @param {?string} str
 * @return {?string}
 */
export function titleCase(str) {
  if (str) {
    return str.replace(__titleCaseRe, __titleCaseReplacer);
  }
  return str;
}

/** @ignore */
const __collapseWhitespaceRe1 = /[\s\xa0]+/g;
/** @ignore */
const __collapseWhitespaceRe2 = /^\s+|\s+$/g;

/**
 * Attempts to collapse all extra white space into a single white space character
 * @param {string} str
 * @return {string}
 */
export function collapseWhitespace(str) {
  return str
    .replace(__collapseWhitespaceRe1, ' ')
    .replace(__collapseWhitespaceRe2, '');
}

/**
 * Returns the string between the left and right string
 * @param {string} str
 * @param {string} left
 * @param {string} right
 * @return {string}
 */
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

/** @ignore */
const __isAlphaRe = /[^a-z\xDF-\xFF]|^$/;

/**
 * Returns T/F indicating if the supplied string is only alpha characters
 * @param {?string} str
 * @return {boolean}
 */
export function isAlpha(str) {
  if (str) {
    return !__isAlphaRe.test(str.toLowerCase());
  }
  return false;
}

/** @ignore */
const __isAlphaNumericRe = /[^0-9a-z\xDF-\xFF]/;

/**
 * Returns T/F indicating if the supplied string is only alpha numeric characters
 * @param {?string} str
 * @return {boolean}
 */
export function isAlphaNumeric(str) {
  if (str) {
    return !__isAlphaNumericRe.test(str.toLowerCase());
  }
  return false;
}

/** @ignore */
const __isEmptyRe = /^[\s\xa0]*$/;

/**
 * Returns T/F indicating if the supplied string is truly an empty string
 * @param {?string} str
 * @return {boolean}
 */
export function isEmptyString(str) {
  return str == null ? true : __isEmptyRe.test(str);
}

/**
 * Returns T/F indicating if the supplied string is only lowercase alpha characters
 * @param {string} str
 * @return {boolean}
 */
export function isLower(str) {
  return isAlpha(str) && str.toLowerCase() === str;
}

/** @ignore */
const __isNumericRe = /[^0-9]/;

/**
 * Returns T/F indicating if the supplied string only contains numeric characters
 * @param {?string} str
 * @return {boolean}
 */
export function isNumeric(str) {
  return str != null ? !__isNumericRe.test(str) : false;
}

/**
 * Returns T/F indicating if the supplied string is only uppercase alpha characters
 * @param {?string} str
 * @return {boolean}
 */
export function isUpper(str) {
  return isAlpha(str) && str.toUpperCase() === str;
}

/**
 * Attempts to convert the supplied string to boolean (true, yes, on, 1)
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
 * Attempts to convert the supplied string to a float
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
 * Attempts to convert the supplied string to a integer
 * @param {string} str
 * @param {number} [base = 10]
 * @return {number}
 */
export function toInt(str, base = 10) {
  return parseInt(str, base);
}

/**
 * Returns the substring from the last index of the supplied needle
 * @param {string} str
 * @param {string} needle - The substring to be searched for
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
 * Returns the substring from the index of the supplied needle
 * @param {string} str
 * @param {string} needle - The substring to be searched for
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
 * @property {number} [searchFrom] - Index to search from for the supplied substring
 * @property {boolean} [include] - Should the supplied substring be included in the returned substring
 **/
