const rollup = require('rollup');
const fs = require('fs-extra');
const path = require('path');
const cleanup = require('rollup-plugin-cleanup');
const prettier = require('prettier');

const srcDir = path.join(process.cwd(), 'src');
const behaviorDir = path.join(srcDir, 'behaviors');
const distDir = path.join(process.cwd(), 'dist');

function makeWrapper(code) {
  return prettier.format(`(function runner(xpg, debug = false) { 
${code.trim()} 
})($x);`, {singleQuote: true, parser: 'babylon'});
}


async function build() {
  const behaviors = await fs.readdir(behaviorDir);
  for (let i = 0; i < behaviors.length; ++i) {
    const bundle = await rollup.rollup({
      input: path.join(behaviorDir, behaviors[i]),
      plugins: []
    });
    const results = await bundle.generate({
      format: 'es',
      exports: 'none',
    });
    console.log(results.code)
    // const code = results.code.replace('export default makeIterator;', '');
    // await fs.writeFile(path.join(distDir, behaviors[i]), makeWrapper(code));
  }
}

build().catch(error => console.error(error));
