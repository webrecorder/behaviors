const { TypeChecker, TypeGuards } = require('ts-morph');
const { CheckState, ExportDefaultType } = require('./states');
const Utils = require('./utils');

class Checking {

  /**
   * @param {?string} name
   * @param {symbol} exportType
   * @return {{exportType: symbol, name: string, state: symbol}}
   */
  static checkExportGood(name, exportType) {
    return { state: CheckState.good, name, exportType };
  }

  /**
   *
   * @param {symbol} [exportType]
   * @return {{exportType: symbol, name: ?string, state: symbol}}
   */
  static checkExportBad(exportType) {
    return { state: CheckState.bad, name: null, exportType };
  }

  /**
   * @param {*} value
   * @return {{checkState: symbol, value: *, errorMsg: ?string}}
   */
  static checkMetadataGood(value) {
    return { checkState: CheckState.good, value, errorMsg: null };
  }
  /**
   * @param {string} errorMsg
   * @param {*} [value]
   * @return {{checkState: symbol, value: *, errorMsg: string}}
   */
  static checkMetadataBad(errorMsg, value) {
    return { checkState: CheckState.bad, value, errorMsg };
  }

  /**
   *
   * @param {Type} type
   * @return {boolean}
   */
  static typeIsAsyncIterator(type) {
    if (type == null) return false;
    const typeText = type.getText();
    return (
      typeText.startsWith('AsyncIterableIterator') ||
      typeText.startsWith('AsyncIterator')
    );
  }

  static resolveAlias(aliasedSymbol) {
    const theAliasedSymbol = aliasedSymbol.getAliasedSymbol();
    if (theAliasedSymbol.isAlias()) {
      return Checking.resolveAlias(theAliasedSymbol);
    }
    return theAliasedSymbol;
  }

  /**
   * @param {string} msg
   * @param {*} [value]
   * @return {{wasError: boolean, value: *, errorMsg: string}}
   */
  static createErrorResultsObj(msg, value) {
    return { wasError: true, value, errorMsg: msg };
  }
  /**
   * @param {*} [value]
   * @return {{wasError: boolean, value: *, errorMsg: null}}
   */
  static createNoErrorResultsObj(value) {
    return { wasError: false, value, errorMsg: null };
  }

  /**
   *
   * @param {TypeChecker} typeChecker
   * @param valueDeclaration
   * @return {{exportType: ?symbol, name: ?string, state: symbol}}
   */
  static checkDefaultExportValueDeclaration(typeChecker, valueDeclaration) {
    // first check for export default [async] function[*] name(...) { ... }
    if (TypeGuards.isFunctionDeclaration(valueDeclaration)) {
      // the default export was a function
      const fnName = valueDeclaration.getName();
      // an async generator is both an async function and a generator
      if (valueDeclaration.isAsync() && valueDeclaration.isGenerator()) {
        return Checking.checkExportGood(fnName, ExportDefaultType.function);
      }
      // was async or generator function or both so we must check the return
      // type of the function by its signature
      const sig = typeChecker.getSignatureFromNode(valueDeclaration);
      if (sig && Checking.typeIsAsyncIterator(sig.getReturnType())) {
        // the functions return type is an async iterator
        return Checking.checkExportGood(fnName, ExportDefaultType.function);
      }
    }
    // the default export was not a function and now we check to see if it is
    // an expression, e.g. init() or a = b
    if (valueDeclaration.getExpression) {
      const expression = valueDeclaration.getExpression();
      // first check for call expression
      if (
        TypeGuards.isCallExpression(expression) &&
        Checking.typeIsAsyncIterator(expression.getReturnType())
      ) {
        // the default export was a call expression that returns an async iterator
        return Checking.checkExportGood(null, ExportDefaultType.value);
      } else if (TypeGuards.isBinaryExpression(expression)) {
        // the default export is a binary expression, e.g. a = b
        const left = expression.getLeft();
        const right = expression.getRight();
        if (
          TypeGuards.isIdentifier(left) &&
          TypeGuards.isCallExpression(right) &&
          Checking.typeIsAsyncIterator(right.getReturnType())
        ) {
          return Checking.checkExportGood(left.getText(), ExportDefaultType.value);
        }
        console.log('watt', right.getText());
      } else {
        console.log('watt', valueDeclaration.print());
      }
    } else {
      // we have a raw value and now must check its type
      const name = valueDeclaration.getName();
      if (Checking.typeIsAsyncIterator(valueDeclaration.getType())) {
        return Checking.checkExportGood(name, ExportDefaultType.value);
      }
    }
    return Checking.checkExportBad();
  }

  /**
   *
   * @param mdataSymbol
   * @param {TypeChecker} typeChecker
   * @return {{checkState: symbol, errorMsg: ?string, value: ?Object }}
   */
  static validateAndExtractMetaData(mdataSymbol, typeChecker) {
    const valueDeclar = mdataSymbol.getValueDeclaration();
    const intializer = valueDeclar.getInitializer();
    const { value, wasError, errorMsg } = Checking.safeConvertMdata(intializer);
    if (!wasError) {
      if (!Utils.isString(value.name)) {
        return Checking.checkMetadataBad(
          Utils.joinStrings(
            'The behavior exported metadata contains a name property that is not a string',
            `It is an ${typeof value.name} with value of ${Utils.inspect(value.name)}`
          ),
          value
        );
      }
      if (!value.defaultBehavior) {
        const matchResults = Checking.checkMetadataMatch(value.match);
        if (matchResults.wasError) {
          return Checking.checkMetadataBad(matchResults.errorMsg, value);
        }
      }
      return Checking.checkMetadataGood(value);
    }
    return Checking.checkMetadataBad(errorMsg, value);
  }

  /**
   *
   * @param expression
   * @param strict
   * @return {{wasError: boolean, value: {}, errorMsg: ?string}}
   */
  static convertArrayLiterExpressionElementExpressions(expression, strict) {
    if (TypeGuards.isObjectLiteralExpression(expression)) {
      return Checking.convertObjectLiteralExpression(expression, {
        name: 'from array literal',
        strict
      });
    }
    return Checking.createErrorResultsObj('booo');
  }

  /**
   *
   * @param arrayLiteralExpression
   * @param {{name: string, strict: boolean}} options
   * @return {{wasError: boolean, value: Array, errorMsg: ?string}}
   */
  static convertArrayLiteralExpression(
    arrayLiteralExpression,
    { name, strict }
  ) {
    const errorMsgs = [];
    const results = [];
    const arrayElems = arrayLiteralExpression.getElements();
    const length = arrayElems.length;
    for (var i = 0; i < length; i++) {
      if (TypeGuards.isStringLiteral(arrayElems[i])) {
        results.push(arrayElems[i].getLiteralValue());
      } else if (TypeGuards.isRegularExpressionLiteral(arrayElems[i])) {
        results.push(arrayElems[i].getLiteralValue());
      } else if (!strict) {
        var subConvertResults = Checking.convertArrayLiterExpressionElementExpressions(
          arrayElems[i],
          strict
        );
        if (!subConvertResults.wasError) {
          results.push(subConvertResults.value);
        } else {
          errorMsgs.push(
            `The property ${name} is an array and the ${Utils.numberOrdinalSuffix(
              i + 1
            )} is in valid ${subConvertResults.errorMsg}`
          );
        }
      } else {
        errorMsgs.push(
          `The property ${name} is an array and the ${Utils.numberOrdinalSuffix(
            i + 1
          )} element is not an String`
        );
      }
    }
    if (errorMsgs.length) {
      return Checking.createErrorResultsObj(Utils.stringifyArray(errorMsgs), results);
    }
    return Checking.createNoErrorResultsObj(results);
  }

  /**
   *
   * @param objectLiteralExpression
   * @param {{name: string, strict: boolean}} options
   * @return {{wasError: boolean, value: {}, errorMsg: ?string}}
   */
  static convertObjectLiteralExpression(
    objectLiteralExpression,
    { name, strict }
  ) {
    const errorMsgs = [];
    const propertyAssignments = objectLiteralExpression.getProperties();
    const length = propertyAssignments.length;
    let propertyAssignment;
    let propName;
    let results = {};
    let convertResults;
    for (var i = 0; i < length; i++) {
      propertyAssignment = propertyAssignments[i];
      propName = propertyAssignment.getName();
      convertResults = Checking.convertMetadataPropAssign(propertyAssignment, {
        name: propName,
        strict
      });
      results[propName] = convertResults.value;
      if (convertResults.wasError) {
        errorMsgs.push(
          `The property ${propName} of parent object ${name} is invalid ${
            convertResults.errorMsg
            }`
        );
      }
    }
    if (errorMsgs.length) {
      return Checking.createErrorResultsObj(Utils.stringifyArray(errorMsgs), results);
    }
    return Checking.createNoErrorResultsObj(results);
  }

  /**
   *
   * @param expression
   * @param {{name: string, strict: boolean}} options
   * @return {{wasError: boolean, value: *, errorMsg: ?string}}
   */
  static convertMetadataPropAssign(expression, { name, strict }) {
    const initializer = expression.getInitializer();
    if (
      TypeGuards.isStringLiteral(initializer) ||
      TypeGuards.isRegularExpressionLiteral(initializer)
    ) {
      return Checking.createNoErrorResultsObj(initializer.getLiteralValue());
    } else if (TypeGuards.isObjectLiteralExpression(initializer)) {
      return Checking.convertObjectLiteralExpression(initializer, {
        name,
        strict
      });
    } else if (TypeGuards.isArrayLiteralExpression(initializer)) {
      return Checking.convertArrayLiteralExpression(initializer, {
        name,
        strict
      });
    } else if (!strict) {
      if (
        TypeGuards.isNumericLiteral(initializer) ||
        TypeGuards.isBooleanLiteral(initializer)
      ) {
        return Checking.createNoErrorResultsObj(initializer.getLiteralValue());
      } else {
        return Checking.createErrorResultsObj(
          `Found metadata property ${Utils.inspect(
            expression.getStructure()
          )}\nIt is not an String, Object, or Array of Strings.`
        );
      }
    }
    return Checking.createErrorResultsObj(
      `Found metadata property ${Utils.inspect(
        expression.getStructure()
      )}\nIt is not an String, Object, or Array of Strings.`
    );
  }

  /**
   *
   * @param initializer
   * @return {{wasError: boolean, errorMsg: ?string, value: {}}}
   */
  static safeConvertMdata(initializer) {
    const errorMsgs = [];
    const metadata = {};
    const propertyAssignments = initializer.getProperties();
    let propertyAssignment;
    let name;
    let convertResults;
    let strict = false;
    const length = propertyAssignments.length;
    for (var i = 0; i < length; i++) {
      propertyAssignment = propertyAssignments[i];
      name = propertyAssignment.getName();
      switch (name.toLowerCase()) {
        case 'name':
        case 'match':
          strict = true;
          break;
        default:
          strict = false;
          break;
      }
      convertResults = Checking.convertMetadataPropAssign(propertyAssignment, {
        name,
        strict
      });
      metadata[name] = convertResults.value;
      if (convertResults.wasError) {
        errorMsgs.push(convertResults.errorMsg);
      }
    }

    if (errorMsgs.length) {
      return Checking.createErrorResultsObj(Utils.stringifyArray(errorMsgs), metadata);
    }
    return Checking.createNoErrorResultsObj(metadata);
  }

  /**
   *
   * @param {?string} regex
   * @return {{wasError: boolean, errorMsg: ?string}}
   */
  static testRegex(regex) {
    if (Utils.isRegex(regex)) {
      return Checking.createNoErrorResultsObj();
    }
    if (!Utils.isString(regex)) {
      return Checking.createErrorResultsObj(
        `The supplied regex was not a string it was ${typeof regex}`
      );
    }
    try {
      new RegExp(regex);
    } catch (e) {
      return Checking.createErrorResultsObj(e.message);
    }
    return Checking.createNoErrorResultsObj();
  }

  static checkRegexBaseSubs({ base, sub }) {
    const subRegexsBadMsgs = [];
    let i = sub.length;
    let subTestResults;
    while (i--) {
      if (!Utils.isStringOrRegex(sub[i])) {
        subRegexsBadMsgs.push(
          `The ${Utils.numberOrdinalSuffix(
            i + 1
          )} sub regex is not a string it is an ${typeof sub[i]}`,
          `Its value is: ${Utils.inspect(sub[i])}`
        );
      } else {
        subTestResults = Checking.testRegex(`${Utils.regexSource(base)}${Utils.regexSource(sub[i])}`);
        if (subTestResults.wasError) {
          subRegexsBadMsgs.push(
            `The ${Utils.numberOrdinalSuffix(
              i + 1
            )} sub regex when combined with the base regex does not appear to be a regular expression`,
            `The error message is: ${subTestResults.errorMsg}`,
            `Its value is ${Utils.inspect(sub[i])}`
          );
        }
      }
    }
    if (subRegexsBadMsgs.length) {
      return Checking.createErrorResultsObj(Utils.stringifyArray(subRegexsBadMsgs));
    }
    return Checking.createNoErrorResultsObj();
  }

  /**
   *
   * @param {Object} regex
   * @return {{wasError: boolean, errorMsg: ?string}}
   */
  static checkRegexObj(regex) {
    if (regex.sub == null) {
      return Checking.createErrorResultsObj(
        Utils.joinStrings(
          'The exported metadata matches on a regex that has a base part',
          `The sub part is is required (Array of strings) but it was ${typeof regex.sub}`
        )
      );
    } else if (!Array.isArray(regex.sub)) {
      return Checking.createErrorResultsObj(
        Utils.joinStrings(
          'The exported metadata matches on a regex that has a base part',
          `The sub part is is required (Array of strings) but it was ${typeof regex.sub}`,
          `Its value is ${Utils.inspect(regex.sub)}`
        )
      );
    }
    const baseTest = Checking.testRegex(regex.base);
    if (baseTest.wasError) {
      return Checking.createErrorResultsObj(
        Utils.joinStrings(
          'The base match regex does not appear to be a regex',
          `The error message is ${baseTest.errorMsg}`,
          `The value of the base regex is ${Utils.inspect(regex.base)}`
        )
      );
    }
    const subResults = Checking.checkRegexBaseSubs(regex);
    if (subResults.wasError) {
      return Checking.createErrorResultsObj(subResults.errorMsg);
    }
    return Checking.createNoErrorResultsObj();
  }

  /**
   *
   * @param {Object|string} regex
   * @return {{wasError: boolean, errorMsg: ?string}}
   */
  static checkRegexBaseSub(regex) {
    if (Utils.isObject(regex)) {
      return Checking.checkRegexObj(regex);
    }
    if (!Utils.isStringOrRegex(regex)) {
      return Checking.createErrorResultsObj(
        Utils.joinStrings(
          'The exported metadata matches on a regex but its value is not a string containing a regular expression',
          `Its value is ${Utils.inspect(regex)}`
        )
      );
    }
    const results = Checking.testRegex(regex);
    if (results.wasError) {
      return Checking.createErrorResultsObj(
        Utils.joinStrings(
          'The exported metadata matches on a regex but its value does not appear to be a regex',
          `The error message is ${results.errorMsg}`,
          `It value of the regex is ${Utils.inspect(regex)}`
        )
      );
    }
    return Checking.createNoErrorResultsObj();
  }

  /**
   *
   * @param {?Object} match
   * @return {{wasError: boolean, errorMsg: ?string}}
   */
  static checkMetadataMatch(match) {
    if (Utils.isString(match)) {
      return Checking.createNoErrorResultsObj();
    }
    if (!Utils.isObject(match)) {
      return Checking.createErrorResultsObj(
        Utils.joinStrings(
          'The behaviors exported metadata contains a match property that is not an object',
          `It is ${typeof match}`,
          `An has value of ${Utils.inspect(match)}`
        )
      );
    }
    if (Utils.isObject(match.regex) && match.regex.sub) {
      return Checking.checkRegexBaseSub(match.regex);
    } else if (Utils.isStringOrRegex(match.regex)) {
      return Checking.createNoErrorResultsObj();
    }
    return Checking.createErrorResultsObj(
      Utils.joinStrings(
        'The behaviors exported metadata contains a match property that does not use a regex',
        `The match object has value of ${Utils.inspect(match)}`
      )
    );
  }

  /**
   *
   * @param {SourceFile} sourceFile
   * @param {TypeChecker} typeChecker
   * @return {{metadata: ?Object, hasPostStep: boolean, state: symbol, defaultExport: ?Object}}
   */
  static checkBehaviorsSourceFile(sourceFile, typeChecker) {
    // get a reference to the modules symbol
    const checkResults = {
      state: CheckState.fileNotModule,
      metadata: null,
      hasPostStep: false,
      defaultExport: null
    };
    const moduleSymbol = sourceFile.getSymbol();
    // if the module symbol is null then its not a module
    // just a _file we should not do anything to but use directly maybe??
    if (moduleSymbol == null) {
      checkResults.state = CheckState.fileNotModule;
      return checkResults;
    }
    const metaData = moduleSymbol.getExportByName('metaData');
    if (metaData) {
      checkResults.metadata = Checking.validateAndExtractMetaData(metaData, typeChecker);
    }
    const defaultExportSymbol = moduleSymbol.getExportByName('default');
    // if the symbol for the default export is null but the module symbol
    // is not null then we can not do anything with it
    if (defaultExportSymbol == null) {
      checkResults.state = CheckState.noDefaultExport;
      return checkResults;
    }

    let result;
    if (defaultExportSymbol.isAlias()) {
      // the default export is referencing some other symbol
      // get the aliased symbol and its value declaration for checking
      const aliasedSymbol = Checking.resolveAlias(defaultExportSymbol);
      const valueDeclaration = aliasedSymbol.getValueDeclaration();
      result = Checking.checkDefaultExportValueDeclaration(typeChecker, valueDeclaration);
    } else {
      // get the aliased symbol and its value declaration for checking
      const valueDeclaration = defaultExportSymbol.getValueDeclaration();
      result = Checking.checkDefaultExportValueDeclaration(typeChecker, valueDeclaration);
    }
    // now lets check to see if the behavior exports a postStep function
    if (moduleSymbol.getExportByName('postStep')) {
      checkResults.hasPostStep = true;
    }
    checkResults.state = result.state;
    checkResults.defaultExport = {
      name: result.name,
      exportType: result.exportType
    };
    return checkResults;
  }
}

module.exports = Checking;
