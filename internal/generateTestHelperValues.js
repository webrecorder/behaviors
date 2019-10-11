const path = require('path');
const fs = require('fs-extra');
const prettier = require('prettier');
const { prettierOpts, makeDefaultBuildCollectOpts } = require('./defaultOpts');
const Utils = require('./utils');
const Behavior = require('./behavior');
const { behaviorsFromDirIterator } = require('./collect');

const TestURLs = {
  youtube: 'https://www.youtube.com/watch?v=MfH0oirdHLs',
  facebook: {
    userfeed: 'https://www.facebook.com/Smithsonian/',
    newsfeed: 'https://www.facebook.com',
  },
  instagram: {
    user: 'https://www.instagram.com/rhizomedotorg/',
    post: 'https://www.instagram.com/p/Bxiub6BB0Ab',
    own: 'https://www.instagram.com/',
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
  fulcrum: {
    epub:
      'https://www.fulcrum.org/epubs/b5644s18r?locale=en#/6/2[cover]!/4/1:0',
  },
};

const BaseAPIUrl = 'http://localhost:3030';
const APIUrls = {
  fetchBehaviorURL: `${BaseAPIUrl}/behavior?url=`,
  fetchBehaviorInfoURL: `${BaseAPIUrl}/info?url=`,
  fetchBehaviorInfoListURL: `${BaseAPIUrl}/info-list?url=`,
  fetchBehaviorByName: `${BaseAPIUrl}/behavior?name=`,
  fetchBehaviorInfoByName: `${BaseAPIUrl}/info?name=`,
  fetchBehaviorInfoListByName: `${BaseAPIUrl}/info-list?name=`,
  fetchBehaviorInfoAll: `${BaseAPIUrl}/info-all`,
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
 * Returns the full URL for requesting a behaviors info
 * @param {string} url - The URL of a page that should have a behavior
 * @return {string}
 */
function fetchBehaviorInfoListURL(url) {
  return `${APIUrls.fetchBehaviorInfoListURL}${url}`;
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
 * Returns the full URL for requesting a behaviors info
 * @param {string} name - The name of the behavior
 * @return {string}
 */
function fetchBehaviorInfoListByName(name) {
  return `${APIUrls.fetchBehaviorInfoListByName}${name}`;
}

/**
 * Creates and returns an tested value object
 * @param {string} name - The name of the object
 * @param {string} bname - The name of the behavior
 * @param {string} url - The URL the behavior is supposed to be matched to
 * @param {Object} metadata - The behaviors metadata
 * @return {{infoListURL: string, metadata: Object, infoURL: string, infoListByNameURL: string, behaviorByNameURL: string, infoByNameURL: string, name: string, url: string, behaviorURL: string}}
 */
function createTestedValue(name, bname, url, metadata) {
  return {
    name,
    metadata,
    url,
    infoURL: fetchBehaviorInfoURL(url),
    infoByNameURL: fetchBehaviorInfoByName(bname),
    infoListURL: fetchBehaviorInfoListURL(url),
    infoListByNameURL: fetchBehaviorInfoListByName(bname),
    behaviorURL: fetchBehaviorURL(url),
    behaviorByNameURL: fetchBehaviorByName(bname),
  };
}

/**
 *
 * @param {Behavior} behavior
 */
function makeTestedValue(behavior) {
  if (behavior.match) {
    behavior.match.regex = behavior.match.regex.source;
  }
  const metadata = behavior.metadata;
  const name = metadata.name;
  const bnameLower = name.toLowerCase();
  for (const [testPart, testValue] of Object.entries(TestURLs)) {
    if (bnameLower.includes(testPart)) {
      if (typeof testValue === 'string') {
        return createTestedValue(
          Utils.upperFirst(testPart),
          name,
          testValue,
          metadata
        );
      }
      for (const [specific, specificValue] of Object.entries(testValue)) {
        if (bnameLower.includes(specific)) {
          return createTestedValue(
            `${Utils.upperFirst(testPart)} ${Utils.upperFirst(specific)}`,
            name,
            specificValue,
            metadata
          );
        }
      }
    }
  }
}

async function generateTestedValues() {
  const opts = await makeDefaultBuildCollectOpts();
  const testValues = [];
  let defaultBehaviorMD;
  const behaviorMdata = {};
  let count = 0;
  for (const behavior of behaviorsFromDirIterator(opts)) {
    behavior.init();
    if (behavior.isDefaultBehavior) {
      defaultBehaviorMD = Utils.inspect(behavior.metadata);
    } else {
      behaviorMdata[behavior.name] = behavior.metadata;
      count += 1;
    }
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
      `module.exports = {
tests: ${Utils.inspect(testValues)},
defaultBMD: ${defaultBehaviorMD},
allResult: {
  url: '${APIUrls.fetchBehaviorInfoAll}',
  count: ${count},
 value: {
  defaultBehavior: ${defaultBehaviorMD},
 behaviors: ${Utils.inspect(behaviorMdata)}
 }
}
};`,
      prettierOpts
    )
  );
}

generateTestedValues().catch(error => {
  console.error(error);
});
