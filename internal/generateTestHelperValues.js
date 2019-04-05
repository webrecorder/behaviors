const path = require('path');
const fs = require('fs-extra');
const prettier = require('prettier');
const { prettierOpts } = require('./defaultOpts');
const { defaultBehaviorMetadataPath, distDir } = require('./paths');
const Utils = require('./utils');

const TestURLs = {
  youtube: 'https://www.youtube.com/watch?v=MfH0oirdHLs',
  facebook: {
    userfeed: 'https://www.facebook.com/Smithsonian/',
    newsfeed: 'https://www.facebook.com'
  },
  instagram: {
    user: 'https://www.instagram.com/rhizomedotorg'
  },
  twitter: {
    hashtags: 'https://twitter.com/hashtag/iipcwac18?vertical=default&src=hash',
    timeline: 'https://twitter.com/webrecorder_io'
  },
  soundcloud: {
    artist: 'https://soundcloud.com/perturbator',
    embed:
      'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/598793067&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true'
  },
  slidshare:
    'https://www.slideshare.net/annaperricci?utm_campaign=profiletracking&utm_medium=sssite&utm_source=ssslideview',
  autoscroll: 'https://example.com',
  deathimitateslanguage: 'https://deathimitateslanguage.harmvandendorpel.com'
};

const BaseAPIUrl = 'http://localhost:3030';
const APIUrls = {
  fetchBehaviorURL: `${BaseAPIUrl}/behavior?url=`,
  fetchBehaviorInfoURL: `${BaseAPIUrl}/info?url=`
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

const splitCaps = /([A-Z])/g;

const { defaultBehavior, behaviors } = require(defaultBehaviorMetadataPath);

const behaviorToMetadata = {
  [defaultBehavior.fileName]: {
    name: defaultBehavior.name,
    description: defaultBehavior.description,
    defaultBehavior: defaultBehavior.defaultBehavior || false
  }
};

for (let i = 0; i < behaviors.length; i++) {
  const behavior = behaviors[i];
  const mdata = {
    name: behavior.name,
    defaultBehavior: behavior.defaultBehavior || false
  };
  if (behavior.description) {
    mdata.description = behavior.description;
  }
  behaviorToMetadata[behavior.fileName] = mdata;
}

const bToMPath = path.join(
  __dirname,
  '..',
  'test',
  'helpers',
  'behaviorToMetadata.js'
);

fs.writeFileSync(
  bToMPath,
  prettier.format(
    `module.exports = ${Utils.inspect(behaviorToMetadata)};`,
    prettierOpts
  )
);

const behaviorFiles = fs.readdirSync(distDir);
const tests = [];

for (let i = 0; i < behaviorFiles.length; i++) {
  const behaviorFile = behaviorFiles[i];
  if (behaviorFile.includes('Metadata')) continue;
  const nameParts = path
    .basename(behaviorFile, '.js')
    .replace(splitCaps, ' $1')
    .split(' ');
  nameParts.pop();
  let url;
  let name;
  switch (nameParts[0]) {
    case 'autoscroll':
      name = 'Default Behavior';
      url = TestURLs.autoscroll;
      break;
    case 'pinterest':
      continue;
    case 'death':
      name = `${Utils.upperFirst(nameParts[0])} ${nameParts
        .slice(1)
        .join(' ')}`;
      url = TestURLs.deathimitateslanguage;
      break;
    case 'slide':
      name = 'Slide Share';
      url = TestURLs.slidshare;
      break;
    default:
      const partOfSite = nameParts.slice(1);
      const psCollapsed = partOfSite.join('').toLowerCase();
      const siteURLs = TestURLs[nameParts[0]];
      url = typeof siteURLs === 'string' ? siteURLs : siteURLs[psCollapsed];
      name = `${Utils.upperFirst(nameParts[0])} ${partOfSite.join(' ')}`;
      break;
  }
  tests.push({
    name,
    infoURL: fetchBehaviorInfoURL(url),
    behaviorURL: fetchBehaviorURL(url),
    filename: behaviorFile
  });
}

const testedValues = path.join(
  __dirname,
  '..',
  'test',
  'helpers',
  'testedValues.js'
);

fs.writeFileSync(
  testedValues,
  prettier.format(`module.exports = ${Utils.inspect(tests)};`, prettierOpts)
);
