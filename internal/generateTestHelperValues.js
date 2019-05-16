const path = require('path');
const fs = require('fs-extra');
const prettier = require('prettier');
const { prettierOpts } = require('./defaultOpts');
const { Project } = require('ts-morph');
const { defaultBehaviorConfigPath } = require('./paths');
const Utils = require('./utils');
const { resolveWhatPath } = require('./build');
const Behavior = require('./behavior');
const { behaviorsFromDirIterator } = require('./collect');
const getConfigIfExistsOrDefault = require('./behaviorConfig');

const TestURLs = {
  youtube: 'https://www.youtube.com/watch?v=MfH0oirdHLs',
  facebook: {
    userfeed: 'https://www.facebook.com/Smithsonian/',
    newsfeed: 'https://www.facebook.com',
  },
  instagram: {
    user: 'https://www.instagram.com/rhizomedotorg',
    post: 'https://www.instagram.com/p/Bxiub6BB0Ab/',
  },
  twitter: {
    hashtags: 'https://twitter.com/hashtag/iipcwac18?vertical=default&src=hash',
    timeline: 'https://twitter.com/webrecorder_io',
  },
  soundcloud: {
    artist: 'https://soundcloud.com/perturbator',
    embed:
      'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/598793067&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true',
  },
  slideshare:
    'https://www.slideshare.net/annaperricci?utm_campaign=profiletracking&utm_medium=sssite&utm_source=ssslideview',
  autoscroll: 'https://example.com',
  deathimitateslanguage: 'https://deathimitateslanguage.harmvandendorpel.com',
};

const BaseAPIUrl = 'http://localhost:3030';
const APIUrls = {
  fetchBehaviorURL: `${BaseAPIUrl}/behavior?url=`,
  fetchBehaviorInfoURL: `${BaseAPIUrl}/info?url=`,
  fetchBehaviorByName: `${BaseAPIUrl}/behavior?name=`,
  fetchBehaviorInfoByName: `${BaseAPIUrl}/info?name=`,
};

/**
 * Returns the full URL for requesting a behaviors JS
 * @param {string} url - The URL of a page that should have a behavior
 * @return {string}
 */
function fetchBehaviorURL(url) {
  return `${APIUrls.fetchBehaviorURL}${url}`;
}

/**
 * Returns the full URL for requesting a behaviors info
 * @param {string} url - The URL of a page that should have a behavior
 * @return {string}
 */
function fetchBehaviorInfoURL(url) {
  return `${APIUrls.fetchBehaviorInfoURL}${url}`;
}

/**
 * Returns the full URL for requesting a behaviors JS
 * @param {string} name - The name of the behavior
 * @return {string}
 */
function fetchBehaviorByName(name) {
  return `${APIUrls.fetchBehaviorByName}${name}`;
}

/**
 * Returns the full URL for requesting a behaviors info
 * @param {string} name - The name of the behavior
 * @return {string}
 */
function fetchBehaviorInfoByName(name) {
  return `${APIUrls.fetchBehaviorInfoByName}${name}`;
}
/**
 *
 * @param {Behavior} behavior
 */
function makeTestedValue(behavior) {
  if (behavior.match) {
    behavior.match.regex = behavior.match.regex.source;
  }
  const name = behavior.metadata.name;
  const bnameLower = name.toLowerCase();
  for (const [testPart, testValue] of Object.entries(TestURLs)) {
    if (bnameLower.includes(testPart)) {
      if (typeof testValue === 'string') {
        return {
          name: Utils.upperFirst(testPart),
          infoURL: fetchBehaviorInfoURL(testValue),
          infoByNameURL: fetchBehaviorInfoByName(name),
          behaviorURL: fetchBehaviorURL(testValue),
          behaviorByNameURL: fetchBehaviorByName(name),
          metadata: behavior.metadata,
          url: testValue,
        };
      }
      for (const [specific, specificValue] of Object.entries(testValue)) {
        if (bnameLower.includes(specific)) {
          console.log(testPart, specific);
          return {
            name: `${Utils.upperFirst(testPart)} ${Utils.upperFirst(specific)}`,
            infoURL: fetchBehaviorInfoURL(specificValue),
            infoByNameURL: fetchBehaviorInfoURL(specificValue),
            behaviorURL: fetchBehaviorByName(name),
            behaviorByNameURL: fetchBehaviorByName(name),
            metadata: behavior.metadata,
            url: specificValue,
          };
        }
      }
    }
  }
}

async function generateTestedValues() {
  const config = await getConfigIfExistsOrDefault({
    config: defaultBehaviorConfigPath,
    build: true,
  });
  const project = new Project({ tsConfigFilePath: config.tsConfigFilePath });
  const dirPath = await resolveWhatPath(config, 'doIt');
  const opts = Object.assign(
    {
      project: project,
      dir: dirPath,
    },
    config
  );
  const testValues = [];
  for (const behavior of behaviorsFromDirIterator(opts)) {
    behavior.init();
    const result = makeTestedValue(behavior);
    if (result) {
      testValues.push(result);
    }
  }
  const bToMPath = path.join(
    __dirname,
    '..',
    'test',
    'helpers',
    'testedValues.js'
  );

  await fs.writeFile(
    bToMPath,
    prettier.format(
      `module.exports = ${Utils.inspect(testValues)};`,
      prettierOpts
    )
  );
}

generateTestedValues().catch(error => {
  console.error(error);
});
