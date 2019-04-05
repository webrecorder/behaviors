const path = require('path');
const fs = require('fs-extra');
const { distDir } = require('../../internal/paths');

/**
 * Loads the supplied behaviors JS as a string
 * @param {string} behavior
 * @return {Promise<string>}
 */
exports.loadBehavior = behavior =>
  fs.readFile(path.join(distDir, behavior), 'utf-8');
