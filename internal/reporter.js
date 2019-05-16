const plur = require('plur');
const ColorPrinter = require('./colorPrinter');
const { behaviorKinds } = require('./utils');

const chalk = ColorPrinter.chalk;

const expectedDefaultExportFormat =
  'export default async function* optionalName() { <your behaviors code> }';

const expectedIsBehaviorExportFormat = 'export const isBehavior = true;';

const metadataFormat1 = `export const metadata = {
  name: 'the name of your behavior',
  match: {
    regex: /an regular expression object dictating the URL the behavior will run on/
  },
  description: 'an description of what your behavior does',
};`;

const metadataFormat2 = `export const metadata = {
  name: 'the name of your behavior',
  match: {
    base: /an regular expression object dictating the base URL the behavior will run on/,
    sub: [/an array of regular expression objects dictating more specific parts of the base URL the behavior will run on/] 
  },
  description: 'an description of what your behavior does',
};`;

class Reporter {
  /**
   * @desc Displays the results of collecting behaviors from a directory
   * @param {{time: number, numBehaviors: number, numNonBehaviors: number, numOnlyMetadata: number, numOnlySentinel: number}}
   */
  static collectedBehaviorsFromDirReport({
    time,
    numBehaviors,
    numNonBehaviors,
    numOnlyMetadata,
    numOnlySentinel,
  }) {
    const numFiles =
      numBehaviors + numNonBehaviors + numOnlyMetadata + numOnlySentinel;
    ColorPrinter.info('Collection complete');
    ColorPrinter.info(
      `Processed ${numFiles} ${plur('file', numFiles)} in ${time}`
    );
    ColorPrinter.info('Found:');
    ColorPrinter.info(` - ${numBehaviors} ${plur('behavior', numBehaviors)}`);
    ColorPrinter.info(
      ` - ${numNonBehaviors} ${plur('non-behavior', numNonBehaviors)}`
    );
    ColorPrinter.info(
      ` - ${numOnlyMetadata} ${plur(
        'file',
        numOnlyMetadata
      )} that look like behaviors but only export metadata`
    );
    ColorPrinter.info(
      ` - ${numOnlySentinel} ${plur(
        'file',
        numOnlyMetadata
      )} that look like behaviors but only export the isBehavior sentinel`
    );
    if (numOnlyMetadata > 0) {
      ColorPrinter.blankLine();
      const nomFiles = plur('file', numOnlyMetadata);
      ColorPrinter.blue(
        `To have the ${nomFiles} that only ${plur(
          'exported',
          'exports',
          numOnlySentinel
        )} metadata be considered ${plur('an ', '', numOnlyMetadata)}${plur(
          'behavior',
          numOnlyMetadata
        )}`
      );
      ColorPrinter.blue(`Please add the following to the ${nomFiles}:`);
      ColorPrinter.blankLine();
      ColorPrinter.printCode(expectedIsBehaviorExportFormat);
    }

    if (numOnlySentinel > 0) {
      ColorPrinter.blankLine();
      const nosFiles = plur('file', numOnlySentinel);
      console.log(
        chalk.blueBright(
          `To have the ${nosFiles} that only ${plur(
            'exported',
            'exports',
            numOnlySentinel
          )} the "isBehavior" sentinel be considered ${plur(
            'an ',
            '',
            numOnlySentinel
          )}${plur('behavior', numOnlySentinel)}`
        )
      );
      console.log(
        chalk.blueBright(`Please add the following to the ${nosFiles}:`)
      );
      ColorPrinter.blankLine();
      Reporter.displayMetadataFormat();
    }
  }

  /**
   * @desc Displays the results of collecting a behavior from a file
   * @param {{result: symbol, time: string, fileName: string}}
   */
  static collectedBehaviorFromFileReport({ result, time, fileName }) {
    if (result === behaviorKinds.behavior) {
      ColorPrinter.info(`${fileName}, collected in ${time}`);
    } else {
      ColorPrinter.error(
        `${fileName}, collected in ${time} and was discovered to not be a behavior`
      );
    }
    switch (result) {
      case behaviorKinds.notABehavior:
        Reporter.fullBehaviorFormatExplanation();
        break;
      case behaviorKinds.maybeBehaviorSentinelOnly:
        ColorPrinter.error(
          'It was discovered to only export the "isBehavior" sentinel\n',
          'For this file to be considered an behavior\nPlease add the following to the file:\n'
        );
        Reporter.displayMetadataFormat();
        break;
      case behaviorKinds.maybeBehaviorMetaDataOnly:
        ColorPrinter.error(
          'It was discovered to only export metadata\n',
          'For this file to be considered an behavior\nPlease add the following to the file:\n'
        );
        ColorPrinter.printCode(expectedIsBehaviorExportFormat);
        break;
    }
  }

  /**
   * @desc Displays the expected behavior format
   */
  static fullBehaviorFormatExplanation() {
    console.log(
      chalk.blueBright('The expected behaviors format is as follows:')
    );
    ColorPrinter.blankLine();
    ColorPrinter.blue(
      `${chalk.blueBright('MUST')} have a ${chalk.blueBright(
        'default export'
      )} that is either an ${chalk.blueBright(
        'async iterator'
      )} or an ${chalk.blueBright('function that returns one')}`
    );
    ColorPrinter.blankLine();
    console.log(chalk.blueBright('Example below:'));
    ColorPrinter.blankLine();
    ColorPrinter.printCode(expectedDefaultExportFormat);
    ColorPrinter.blankLine();
    ColorPrinter.blue(
      `${chalk.blueBright(
        'MUST'
      )} export metadata in one of the following formats:`
    );
    ColorPrinter.blankLine();
    Reporter.displayMetadataFormat();
    ColorPrinter.blankLine();
    console.log(
      chalk.blueBright(
        'Finally to even be considered an behavior the is behavior sentinel MUST be exported as shown below\n'
      )
    );
    ColorPrinter.printCode(expectedIsBehaviorExportFormat);
  }

  /**
   * @desc Displays the two allowed formats for behavior metadata
   */
  static displayMetadataFormat() {
    ColorPrinter.printCode(metadataFormat1);
    console.log(chalk.blueBright('\nOR\n'));
    ColorPrinter.printCode(metadataFormat2);
  }
}

module.exports = Reporter;
