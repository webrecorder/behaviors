const rollup = require('rollup');
const fs = require('fs-extra');
const path = require('path');
const behaviorWrapper = require('./behavior-wrapper-plugin');
const inquirer = require('inquirer');
const program = require('commander');

const srcDir = path.join(process.cwd(), 'src');
const behaviorDir = path.join(srcDir, 'behaviors');
const distDir = path.join(process.cwd(), 'dist');

async function build(file, check = false) {
  const fp = path.join(behaviorDir, file);
  if (check) {
    const exists = await fs.pathExists(fp);
    if (!exists) throw new Error(`The behavior file ${fp} does not exist`);
  }
  const bundle = await rollup.rollup({
    input: path.join(behaviorDir, fp),
    plugins: [
      behaviorWrapper({
        noWrapperFiles: new Set(['autoscroll.js'])
      })
    ]
  });
  const results = await bundle.generate({
    sourcemap: false,
    format: 'es',
    exports: 'none'
  });
  await fs.writeFile(path.join(distDir, file), results.code);
}

async function buildAll() {
  const behaviors = await fs.readdir(behaviorDir);
  for (let i = 0; i < behaviors.length; ++i) {
    console.log(`building ${behaviors[i]}`);
    await build(behaviors[i]);
    console.log(`built ${behaviors[i]}`);
  }
}

async function watchConfig() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'behavior',
      message: 'Select a behavior have watched for continuous building',
      choices: await fs.readdir(behaviorDir)
    }
  ]);
  const watcher = rollup.watch({
    input: path.join(behaviorDir, answers.behavior),
    output: {
      file: path.join('dist', answers.behavior),
      sourcemap: false,
      format: 'es',
      exports: 'none'
    },
    plugins: [
      behaviorWrapper({
        noWrapperFiles: new Set(['autoscroll.js'])
      })
    ],
    watch: {
      chokidar: {
        cwd: srcDir
      }
    }
  });
  watcher.on('event', event => {
    console.log(event);
  });
}

program
  .option('-a, --all', 'Build All')
  .option('-f, --file <file>', 'Build file')
  .parse(process.argv);

if (program.all) {
  buildAll().catch(error => console.error(error));
} else if (program.file) {
  build(program.file, true).catch(error => console.error(error));
} else {
  watchConfig().catch(error => console.error(error));
}
// build().catch(error => console.error(error));
