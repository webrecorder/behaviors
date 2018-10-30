import { scrollIntoViewWithDelay } from '../utils/scrolls';
import {
  selectElemFromAndClick,
  selectElemFromAndClickWithDelay
} from '../utils/clicks';
import { delay } from '../utils/delays';
import {
  addBehaviorStyle,
  markElemAsVisited,
  maybePolyfillXPG
} from '../utils/dom';
import {collectOutlinksFrom} from '../utils/outlinkCollector';

addBehaviorStyle('.wr-debug-visited {border: 6px solid #3232F1;}');

const xpQueries = {
  soundItem:
    '//div[@class="userStreamItem" and not(contains(@class, "wrvistited"))]'
};

const selectors = {
  loadMoreTracks: 'a.compactTrackList__moreLink',
  playSingleTrack: 'a.playButton',
  multiTrackItem: 'li.compactTrackList__item',
  playMultiTrackTrack: 'div.compactTrackListItem.clickToPlay'
};

function needToLoadMoreTracks(elem) {
  return elem.querySelector(selectors.loadMoreTracks) != null;
}

async function* playMultipleTracks(elem) {
  const tracks = elem.querySelectorAll(selectors.multiTrackItem);
  let i = 0;
  let len = tracks.length;
  if (len === 0) {
    yield false;
    return;
  }
  let playable;
  for (; i < len; ++i) {
    playable = tracks[i];
    markElemAsVisited(playable);
    if (debug) playable.classList.add('wr-debug-visited');
    await scrollIntoViewWithDelay(playable);
    yield selectElemFromAndClick(playable, selectors.playMultiTrackTrack);
  }
}

async function* vistSoundItems(xpathGenerator) {
  let snapShot = xpathGenerator(xpQueries.soundItem);
  let soundItem;
  let i, len;
  if (snapShot.length === 0) return;
  do {
    len = snapShot.length;
    i = 0;
    for (; i < len; ++i) {
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

window.$WRIterator$ = vistSoundItems(maybePolyfillXPG(xpg));
window.$WRIteratorHandler$ = async function() {
  const results = await $WRIterator$.next();
  return { done: results.done, wait: results.value };
};
