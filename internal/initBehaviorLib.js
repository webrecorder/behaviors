const Path = require('path');
const fs = require('fs-extra');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const bTypes = require('@babel/types');
const prettier = require('prettier');
const { prettierOpts, BParseOptions } = require('./defaultOpts');

const libDir = Path.resolve(Path.join('..', 'wr-behaviors', 'lib'));

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
      strings.push(...exported.default)
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
  return s1.localeCompare(s2)
}

async function generateLibIndex() {
  const exportedFromIndex = new Map();
  const libFiles = await fs.readdir(libDir);
  let i = 0;
  let length = libFiles.length;
  let content;
  let libFP;
  let exported;
  for (; i < length; ++i) {
    if (libFiles[i] !== 'index.js') {
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
    Path.join(libDir, 'index.js'),
    prettier.format(indexFileString.join('\n'), prettierOpts),
    'utf8'
  );
}

generateLibIndex().catch(error => console.error(error));
