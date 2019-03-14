import * as lib from '../../lib'
import { selectors, xpQueries } from './shared';

const styleClasses = lib.addBehaviorStyle(
  '.wr-debug-visited {border: 6px solid #3232F1;} .wr-debug-visited-thread-reply {border: 6px solid green;} .wr-debug-visited-overlay {border: 6px solid pink;} .wr-debug-click {border: 6px solid red;}'
);

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
    lib.markElemAsVisited(playable);
    if (debug) lib.addClass(playable, styleClasses.wrDebugVisited);
    await lib.scrollIntoViewWithDelay(playable);
    yield lib.selectElemFromAndClick(playable, selectors.playMultiTrackTrack);
  }
}

export default async function* visitSoundItems(cliAPI) {
  let snapShot = cliAPI.$x(xpQueries.soundItem);
  let soundItem;
  let i, len;
  if (snapShot.length === 0) return;
  do {
    len = snapShot.length;
    for (i = 0; i < len; ++i) {
      soundItem = snapShot[i];
      lib.markElemAsVisited(soundItem);
      lib.collectOutlinksFrom(soundItem);
      if (debug) lib.addClass(soundItem, styleClasses.wrDebugVisited);
      await lib.scrollIntoViewWithDelay(soundItem);
      if (needToLoadMoreTracks(soundItem)) {
        await lib.selectElemFromAndClickWithDelay(
          soundItem,
          selectors.loadMoreTracks
        );
        yield* playMultipleTracks(soundItem);
      } else {
        yield lib.selectElemFromAndClick(soundItem, selectors.playSingleTrack);
      }
    }
    snapShot = cliAPI.$x(xpQueries.soundItem);
    if (snapShot.length === 0) {
      await lib.delay();
      snapShot = cliAPI.$x(xpQueries.soundItem);
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
