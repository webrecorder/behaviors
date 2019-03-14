import * as lib from '../../lib';
import { selectors, xpQueries } from './shared';

const styleClasses = lib.addBehaviorStyle(
  '.wr-debug-visited {border: 6px solid #3232F1;} .wr-debug-visited-thread-reply {border: 6px solid green;} .wr-debug-visited-overlay {border: 6px solid pink;} .wr-debug-click {border: 6px solid red;}'
);

function isMultiTrackEmbed(xpathGenerator) {
  return xpathGenerator(xpQueries.soundListItem).length > 0;
}

async function* playMultiTracks(xpathGenerator) {
  let snapShot = xpathGenerator(xpQueries.soundListItem);
  let soundItem;
  let i, len;
  if (snapShot.length === 0) return;
  do {
    len = snapShot.length;
    for (i = 0; i < len; ++i) {
      soundItem = snapShot[i];
      if (debug) {
        lib.addClass(soundItem, styleClasses.wrDebugVisited);
      }
      await lib.scrollIntoViewWithDelay(soundItem);
      yield lib.selectElemFromAndClick(soundItem, selectors.soundItem);
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
    yield lib.selectElemFromAndClick(document, selectors.singleTrackEmbedPlay);
  }
}

export const metaData = {
  name: 'soundCloudEmbedBehavior',
  match: {
    regex: /^https:\/\/w\.soundcloud\.com\/player\/?visual=true&url=.+/
  },
  description:
    'Plays all tracks or collection of that are in the soundcloud embed. Once a track has been played, the next track is not played until network idle has been reached'
};

export const isBehavior = true;
