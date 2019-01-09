import {
  delay,
  scrollIntoViewWithDelay,
  selectElemFromAndClick
} from '../../lib/index';
import { selectors, xpQueries } from './shared';

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
      soundItem.classList.add('wrvistited');
      await scrollIntoViewWithDelay(soundItem);
      yield selectElemFromAndClick(soundItem, selectors.soundItem);
    }
    snapShot = xpathGenerator(xpQueries.soundListItem);
    if (snapShot.length === 0) {
      await delay();
      snapShot = xpathGenerator(xpQueries.soundListItem);
    }
  } while (snapShot.length > 0);
}

export default async function* soundCloudEmbedBehavior(xpathGenerator) {
  if (isMultiTrackEmbed(xpathGenerator)) {
    yield* playMultiTracks(xpathGenerator);
  } else {
    yield selectElemFromAndClick(document, selectors.singleTrackEmbedPlay);
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
