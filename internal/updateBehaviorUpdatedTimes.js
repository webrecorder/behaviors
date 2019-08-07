const cp = require('child_process');
const { makeDefaultBuildCollectOpts } = require('./defaultOpts');
const { behaviorsFromDirIterator } = require('./collect');
const { rootDir } = require('./paths');

/**
 * Returns the last commit time for the supplied file path
 * @param {string} filePath - The path to file to have its last commit time retrieved
 * @param {string} [format = '%cI'] - optional git log format string, defaults to strict ISO 8601
 * @return {Promise<string>}
 */
function gitLastCommitTime(filePath, format = '%cI') {
  return new Promise((resolve, reject) => {
    cp.exec(
      `git log -1 --format=${format} ${filePath.replace(`${rootDir}/`, '')}`,
      { cwd: rootDir, env: process.env },
      (error, stdout, stderr) => {
        if (error) return reject(error);
        resolve(stdout.trim());
      }
    );
  });
}

/**
 * Updates the "updated" behavior metadata property for all behaviors
 * if the last commit time is more recent than the current value of
 * the property
 * @return {Promise<void>}
 */
async function updateBehaviorUpdatedTimes() {
  const opts = await makeDefaultBuildCollectOpts();
  for (const behavior of behaviorsFromDirIterator(opts)) {
    const time = await gitLastCommitTime(behavior.filePath);
    if (time && behavior.setUpdatedMetadata(time)) {
      console.log('Updated: ', behavior.filePath);
    } else {
      console.log('Not updated: ', behavior.filePath);
    }
  }
}

updateBehaviorUpdatedTimes().catch(error => {
  console.error(error);
});
