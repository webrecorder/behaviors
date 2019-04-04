const chalk = require('chalk').default;
const highlightCode = require('@babel/highlight').default;

class ColorPrinter {
  static printCode(code) {
    console.log(highlightCode(code));
  }

  static highlightCode(code) {
    return highlightCode(code);
  }

  static green(...text) {
    console.log(chalk.green(...text));
  }

  static blue(...text) {
    console.log(chalk.blue(...text));
  }

  static error(...text) {
    console.log(chalk.red(...text));
  }

  static warning(...text) {
    console.log(chalk.yellow(...text));
  }

  static info(...text) {
    console.log(chalk.green(...text));
  }

  static showError(msg, error) {
    console.log(chalk.red(msg, '\n', error.message));
  }

  static blankLine() {
    console.log();
  }
}

/**
 * @type {Chalk}
 */
ColorPrinter.chalk = chalk;

module.exports = ColorPrinter;
