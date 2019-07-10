import * as lib from '../../lib';
import { selectors, xpQueries } from './shared';

let behaviorStyle;
if (debug) {
  behaviorStyle = lib.addBehaviorStyle(
    '.wr-debug-visited {border: 6px solid #3232F1;} .wr-debug-visited-thread-reply {border: 6px solid green;} .wr-debug-visited-overlay {border: 6px solid pink;} .wr-debug-click {border: 6px solid red;}'
  );
}

function isMultiTrackEmbed(xpathGenerator) {
  return xpathGenerator(xpQueries.soundListItem).length > 0;
}

async function* playMultiTracks(xpathGenerator) {
  let snapShot = xpathGenerator(xpQueries.soundListItem);
  let soundItem;
  let i, len;
  if (snapShot.length === 0) return;
  let totalTracks = 0;
  do {
    len = snapShot.length;
    for (i = 0; i < len; ++i) {
      soundItem = snapShot[i];
      if (debug) {
        lib.addClass(soundItem, behaviorStyle.wrDebugVisited);
      }
      totalTracks += 1;
      await lib.scrollIntoViewWithDelay(soundItem);

      yield lib.createState(
        lib.selectElemFromAndClick(soundItem, selectors.soundItem),
        `Played track #${totalTracks}`
      );
    }
    snapShot = xpathGenerator(xpQueries.soundListItem);
    if (snapShot.length === 0) {
      await lib.delay();
      snapShot = xpathGenerator(xpQueries.soundListItem);
    }
  } while (snapShot.length > 0);
}

export default async function* soundCloudEmbedBehavior(cliAPI) {
  if (isMultiTrackEmbed(cliAPI.$x)) {
    yield* playMultiTracks(cliAPI.$x);
  } else {
    yield lib.createState(
      lib.selectElemFromAndClick(document, selectors.singleTrackEmbedPlay),
      'Played single track'
    );
  }
}

export const metadata = {
  name: 'soundCloudEmbedBehavior',
  match: {
    regex: /^https:\/\/w\.soundcloud\.com\/player\/.+/,
  },
  description: 'Capture every track in the Soundcloud embed.',
  updated: '2019-06-24T15:09:02',
};

export const isBehavior = true;
