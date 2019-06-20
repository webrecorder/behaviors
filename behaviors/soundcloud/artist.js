import * as lib from '../../lib';
import { selectors } from './shared';

let behaviorStyle;
if (debug) {
  behaviorStyle = lib.addBehaviorStyle(
    '.wr-debug-visited {border: 6px solid #3232F1;} .wr-debug-visited-thread-reply {border: 6px solid green;} .wr-debug-visited-overlay {border: 6px solid pink;} .wr-debug-click {border: 6px solid red;}'
  );
}

function needToLoadMoreTracks(elem) {
  const moreTracks = elem.querySelector(selectors.loadMoreTracks);
  // the text is updated to state "View N tracks" if more are to be loaded
  // otherwise "View fewer tracks"
  if (moreTracks) return !lib.elementTextContains(elem, 'fewer');
  return false;
}

async function* handleMultipleTrackItem(playable) {
  lib.markElemAsVisited(playable);
  if (debug) lib.addClass(playable, behaviorStyle.wrDebugVisited);
  // this element used to be somewhere deeper in the markup
  let subTrackItem = playable.firstElementChild;
  let clicked;
  if (subTrackItem) {
    await lib.scrollIntoViewWithDelay(subTrackItem);
    clicked = await lib.clickWithDelay(subTrackItem);
  }
  if (!subTrackItem) {
    // fail fish lets try old method
    subTrackItem = lib.qs(selectors.playMultiTrackTrack, playable);
    await lib.scrollIntoViewWithDelay(subTrackItem);
    clicked = await lib.clickWithDelay(subTrackItem);
  }
  const subTrackTitle = lib.qs(selectors.playMultiTrackTrackAlt, playable);
  if (!subTrackItem) {
    // last try lets click the span containing the sub tracks title?
    await lib.scrollIntoViewWithDelay(subTrackTitle);
    clicked = await lib.clickWithDelay(subTrackTitle);
  }
  yield lib.createState(
    clicked,
    `Played sub track - ${subTrackTitle.innerText || 'no description'}`
  );
}

async function* handleSoundItem(soundListItem) {
  // sound cloud has gotten mighty finicky about how fast you can play their tracks
  // since each track is being played via the app's JS one at a time and not
  // via your run of the mill audio tag we gotta be slower than normal
  lib.collectOutlinksFrom(soundListItem);
  const soundItem = soundListItem.firstElementChild;
  if (debug) lib.addClass(soundItem, behaviorStyle.wrDebugVisited);
  await lib.scrollIntoViewWithDelay(soundItem);
  const whichTrack = soundItem.firstElementChild
    ? soundItem.firstElementChild.getAttribute('aria-label')
    : 'track';
  yield lib.stateWithMsgWaitFromAwaitable(
    lib.selectElemFromAndClickWithDelay(soundItem, selectors.playSingleTrack),
    `Played ${whichTrack}`
  );
  const trackList = lib.qs(selectors.trackList, soundItem);
  if (trackList) {
    // load more tracks before traversal
    if (needToLoadMoreTracks(soundItem)) {
      await lib.selectElemFromAndClickWithDelay(
        soundItem,
        selectors.loadMoreTracks
      );
    }
    // use a very guarded child element traversal
    // if there are a TON of tracks the load more
    // button *should* still state we need to
    // otherwise we just need to walk the loader parents
    // children once
    yield* lib.traverseChildrenOfLoaderParentGenFn(
      trackList,
      handleMultipleTrackItem,
      async () => {
        const loadMore = needToLoadMoreTracks(soundItem);
        if (loadMore) {
          await lib.selectElemFromAndClickWithDelay(
            soundItem,
            selectors.loadMoreTracks
          );
        }
        return loadMore;
      }
    );
  }
}

export default async function* visitSoundItems(cliAPI) {
  // there are two unique lists of tracks so lets just visit all their kiddies
  // the first is the tracks the artist want's to be spot lighted
  const spotLightList = lib.qs('ul.spotlight__list');
  if (spotLightList.hasChildNodes()) {
    yield* lib.traverseChildrenOf(spotLightList, handleSoundItem);
  }
  // the second are the tracks the artist tracks / mix tapes / splits etc
  const userStream = lib.qs('div.userStream__list > ul');
  if (userStream.hasChildNodes()) {
    yield* lib.traverseChildrenOfLoaderParent(userStream, handleSoundItem);
  }
}

export const metaData = {
  name: 'soundCloudArtistBehavior',
  match: {
    regex: /^(?:https:\/\/(?:www\.)?)?soundcloud\.com\/[^/]+(\/)?$/,
  },
  description:
    'Plays all tracks or collection of tracks by the artist. Once a track has been played, the next track is not played until network idle has been reached.'
};

export const isBehavior = true;
