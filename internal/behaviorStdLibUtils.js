const Path = require('path');
const fs = require('fs-extra');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const bTypes = require('@babel/types');
const prettier = require('prettier');
const rollup = require('rollup');
const ColorPrinter = require('./colorPrinter');
const Utils = require('./utils');
const { makeInputOutputConfig } = require('./buildInfo');
const { prettierOpts, BParseOptions } = require('./defaultOpts');
const { libDir, rootDir } = require('./paths');

const libIndexPath = Path.join(libDir, 'index.js');

function addToExported(path, exported, isDefault = false) {
  if (bTypes.isVariableDeclaration(path.node.declaration)) {
    const declars = path.node.declaration.declarations;
    const len = declars.length;
    let i = 0;
    if (isDefault) {
      exported.default = [];
    }
    for (; i < len; ++i) {
      if (isDefault) {
        exported.default.push(declars[i].id.name);
      } else {
        exported.exports.push(declars[i].id.name);
      }
    }
  } else if (
    bTypes.isFunctionDeclaration(path.node.declaration) ||
    bTypes.isClassDeclaration(path.node.declaration)
  ) {
    if (isDefault) {
      exported.default = path.node.declaration.id.name;
    } else {
      exported.exports.push(path.node.declaration.id.name);
    }
  }
}

function makeExportFrom([file, exported]) {
  const strings = ['export '];
  if (exported.default) {
    if (Array.isArray(exported.default)) {
      strings.push(...exported.default);
    } else {
      strings.push(exported.default);
    }
    if (exported.exports.length > 0) {
      strings.push(', ');
    }
  }
  if (exported.exports.length > 0) {
    strings.push('{ ', exported.exports.join(', '), ' } ');
  }
  strings.push(`from './${file}';`);
  return strings.join('');
}

function stringSort(s1, s2) {
  return s1.localeCompare(s2);
}

class StdLibUtils {
  static async generateLibIndex() {
    ColorPrinter.info(`Generating the behavior std library's index file`);
    const startTime = process.hrtime();
    const exportedFromIndex = new Map();
    const libFiles = await fs.readdir(libDir);
    let content;
    let libFP;
    let exported;
    let numFilesProcessed = 0;
    for (var i = 0; i < libFiles.length; ++i) {
      if (libFiles[i] !== 'index.js') {
        numFilesProcessed += 1;
        libFP = Path.join(libDir, libFiles[i]);
        exported = { default: null, exports: [] };
        content = await fs.readFile(libFP, 'utf8');
        exportedFromIndex.set(Path.basename(libFiles[i], '.js'), exported);
        traverse(parse(content, BParseOptions), {
          ExportDefaultDeclaration(path) {
            addToExported(path, exported, true);
          },
          ExportNamedDeclaration(path) {
            addToExported(path, exported);
          }
        });
        exported.exports.sort(stringSort);
      }
    }
    const indexFileString = [];
    for (const entry of exportedFromIndex.entries()) {
      indexFileString.push(makeExportFrom(entry));
    }

    await fs.writeFile(
      libIndexPath,
      prettier.format(indexFileString.join('\n'), prettierOpts),
      'utf8'
    );
    ColorPrinter.info(
      `Processed ${numFilesProcessed} files and generated the behavior std library's index file in ${Utils.timeDiff(
        startTime
      )}`
    );
  }

  static async exposeLibOnWinScript() {
    ColorPrinter.info('Generating debug script');
    const startTime = process.hrtime();
    const indexContents = await fs.readFile(libIndexPath, 'utf-8');
    const specifiers = [];
    traverse(parse(indexContents, BParseOptions), {
      ExportSpecifier(path) {
        specifiers.push(
          `  ${path.node.exported.name}: lib.${path.node.exported.name}`
        );
      }
    });

    const code = prettier.format(
      `import * as lib from '${libIndexPath.replace('.js', '')}';

window.lib = {
${specifiers.join(',\n')}
};
`,
      prettierOpts
    );
    const tempLibOnWinPath = Path.join(rootDir, 'tempLibOnWindow.js');
    const libOnWinPath = Path.join(rootDir, 'libOnWindow.js');
    await fs.writeFile(tempLibOnWinPath, code);
    const { inConf, outConf } = makeInputOutputConfig(
      tempLibOnWinPath,
      libOnWinPath
    );
    // remove wrappers.setup from plugins
    inConf.plugins.pop();
    // output self executing function
    outConf.format = 'iife';
    const bundle = await rollup.rollup(inConf);
    await bundle.write(outConf);
    await fs.remove(tempLibOnWinPath);
    ColorPrinter.info(
      `Generated debug script in ${Utils.timeDiff(startTime)}: ${libOnWinPath}`
    );
  }
}

module.exports = StdLibUtils;
