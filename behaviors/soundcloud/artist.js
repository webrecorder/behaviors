import {
  collectOutlinksFrom,
  delay,
  markElemAsVisited,
  scrollIntoViewWithDelay,
  selectElemFromAndClick,
  selectElemFromAndClickWithDelay
} from '../../lib';

import { selectors, xpQueries } from './shared';

function needToLoadMoreTracks(elem) {
  return elem.querySelector(selectors.loadMoreTracks) != null;
}

async function* playMultipleTracks(elem) {
  const tracks = elem.querySelectorAll(selectors.multiTrackItem);
  let len = tracks.length;
  if (len === 0) {
    yield false;
    return;
  }
  let playable;
  for (var i = 0; i < len; ++i) {
    playable = tracks[i];
    markElemAsVisited(playable);
    if (debug) playable.classList.add('wr-debug-visited');
    await scrollIntoViewWithDelay(playable);
    yield selectElemFromAndClick(playable, selectors.playMultiTrackTrack);
  }
}

export default async function* visitSoundItems(xpathGenerator) {
  let snapShot = xpathGenerator(xpQueries.soundItem);
  let soundItem;
  let i, len;
  if (snapShot.length === 0) return;
  do {
    len = snapShot.length;
    for (i = 0; i < len; ++i) {
      soundItem = snapShot[i];
      markElemAsVisited(soundItem);
      collectOutlinksFrom(soundItem);
      if (debug) soundItem.classList.add('wr-debug-visited');
      await scrollIntoViewWithDelay(soundItem);
      if (needToLoadMoreTracks(soundItem)) {
        await selectElemFromAndClickWithDelay(
          soundItem,
          selectors.loadMoreTracks
        );
        yield* playMultipleTracks(soundItem);
      } else {
        yield selectElemFromAndClick(soundItem, selectors.playSingleTrack);
      }
    }
    snapShot = xpathGenerator(xpQueries.soundItem);
    if (snapShot.length === 0) {
      await delay();
      snapShot = xpathGenerator(xpQueries.soundItem);
    }
  } while (snapShot.length > 0);
}

export const metaData = {
  name: 'soundCloudArtistBehavior',
  match: {
    regex: /^(?:https:\/\/(?:www\.)?)?soundcloud\.com\/[^/]+(\/)?$/
  },
  description: 'Plays all tracks or collection of tracks by the artist, Once a track has been played, the next track is not played until network idle has been reached'
};

export const isBehavior = true;
