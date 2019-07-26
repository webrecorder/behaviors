import * as lib from '../../lib';
import * as selectors from './selectors';
import * as shared from './shared';

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

const Reporter = {
  state: {
    tracksPlayed: 0,
    trackListsPlayed: 0,
  },
  playingTrack(wait, track, parentTrack) {
    this.state.tracksPlayed += 1;
    const specifics = parentTrack
      ? `"${track}" of "${parentTrack}"`
      : `"${track}"`;
    return lib.createState(wait, `Playing ${specifics}`, this.state);
  },
  playingMultiTrack(wait, msg) {
    return lib.createState(wait, `Playing mutli-track "${msg}"`, this.state);
  },
  playedMultiTrackList(multiTrack) {
    this.state.trackListsPlayed += 1;
    return lib.stateWithMsgNoWait(
      `Played all tracks of "${multiTrack}"`,
      this.state
    );
  },
  done(tracksWerePlayed, place) {
    const specifics = tracksWerePlayed
      ? `every "${place}" tracks played`
      : `there were no "${place}" tracks to be played`;
    return lib.stateWithMsgNoWait(
      `Behavior finished, ${specifics}`,
      this.state
    );
  },
};

async function handleMultipleTrackItem(playable, parentTrack) {
  lib.markElemAsVisited(playable);
  if (debug) lib.addClass(playable, behaviorStyle.wrDebugVisited);
  const whichTrack = shared.trackTitle(playable, 'A track');
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
  if (!subTrackItem) {
    const subTrackTitle = lib.qs(selectors.playMultiTrackTrackAlt, playable);
    // last try lets click the span containing the sub tracks title?
    await lib.scrollIntoViewWithDelay(subTrackTitle);
    clicked = await lib.clickWithDelay(subTrackTitle);
  }
  return Reporter.playingTrack(clicked, whichTrack, parentTrack);
}

async function* handleSoundItem(soundListItem) {
  // sound cloud has gotten mighty finicky about how fast you can play their tracks
  // since each track is being played via the app's JS one at a time and not
  // via your run of the mill audio tag we gotta be slower than normal
  lib.collectOutlinksFrom(soundListItem);
  const soundItem = soundListItem.firstElementChild;
  if (debug) lib.addClass(soundItem, behaviorStyle.wrDebugVisited);
  await lib.scrollIntoViewWithDelay(soundListItem);
  // console.log('soundItem', soundItem);
  const whichTrack = shared.trackTitle(soundItem, 'A track');
  const played = await lib.selectElemFromAndClickWithDelay(
    soundItem,
    selectors.playSingleTrack
  );
  const trackList = lib.qs(selectors.trackList, soundItem);
  if (!trackList) {
    yield Reporter.playingTrack(played, whichTrack);
    return;
  }
  yield Reporter.playingMultiTrack(played, whichTrack);
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
    },
    whichTrack
  );
  yield Reporter.playedMultiTrackList(whichTrack);
}

/**
 * Handles capturing of all tracks for an artist's profile
 *
 * The profile is broken up into different sections
 *  - All (default)
 *  - Tracks
 *  - Albums
 *  - Playlists
 *  - Reposts
 *
 *  The All tab can have two parts, an optional spotlight track list and then
 *  all tracks contained in the other sections.
 *  The other sections only have one list.
 *  Each sections markup is unique.
 *
 * @param cliAPI
 * @return {AsyncIterableIterator<{msg: *, state: *, wait: boolean}>}
 */
export default async function* visitSoundItems(cliAPI) {
  if (lib.selectorExists(selectors.popupAnnouncementMsg)) {
    const msg = lib.qs(selectors.popupAnnouncementMsg);
    if (lib.elementTextContains(msg, 'cookies')) {
      lib.click(msg.nextElementSibling);
    }
  }
  // first check to see if we viewing an artists
  // tracks, albums, or playlists
  let tracksWerePlayed = false;
  const tracksAlbumsPlayLists = lib.qs(
    selectors.tracksAlbumsPlaylistsTrackList
  );
  if (lib.elemHasChildren(tracksAlbumsPlayLists)) {
    tracksWerePlayed = true;
    yield* lib.traverseChildrenOfLoaderParent(
      tracksAlbumsPlayLists,
      handleSoundItem
    );
  }
  // next check for viewing an artists reposts
  const reposts = lib.qs(selectors.repostsTrackList);
  if (lib.elemHasChildren(reposts)) {
    tracksWerePlayed = true;
    yield* lib.traverseChildrenOfLoaderParent(reposts, handleSoundItem);
  }

  // there are two unique lists of tracks so lets just visit all their kiddies
  // the first is the tracks the artist want's to be spot lighted
  const spotLightList = lib.qs(selectors.spotlightList);
  if (lib.elemHasChildren(spotLightList)) {
    tracksWerePlayed = true;
    yield* lib.traverseChildrenOf(spotLightList, handleSoundItem);
  }
  // the second are the tracks the artist tracks / mix tapes / splits etc
  const userStream = lib.qs(selectors.userTrackStream);
  if (lib.elemHasChildren(userStream)) {
    tracksWerePlayed = true;
    yield* lib.traverseChildrenOfLoaderParent(userStream, handleSoundItem);
  }
  return Reporter.done(
    tracksWerePlayed,
    (lib.innerTextOfSelected(selectors.artistActiveTab) || '').trim()
  );
}

export const metadata = {
  name: 'soundCloudArtistBehavior',
  match: {
    regex: /^(?:https?:\/\/(?:www\.)?)?soundcloud\.com\/(?!(?:discover|stream))[^/]+(?:\/(?:tracks|albums|sets|reposts))?(?:\/)?$/,
  },
  description: 'Capture every track on Soundcloud profile.',
  updated: '2019-07-23T19:39:46-04:00',
};

export const isBehavior = true;
