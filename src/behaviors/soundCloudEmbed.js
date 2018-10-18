import { delay } from '../utils/delays';
import { scrollIntoViewWithDelay } from '../utils/scrolls';
import { selectElemFromAndClick } from '../utils/clicks';
import { addBehaviorStyle } from '../utils/dom';

addBehaviorStyle('.wr-debug-visited {border: 6px solid #3232F1;}');

const xpQueries = {
  soundListItem:
    '//li[contains(@class, "soundsList__item") and not(contains(@class, "wrvistited"))]'
};

const selectors = {
  soundItem: 'div.soundItem',
  singleTrackEmbedPlay: 'button[role="application"].playButton'
};

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
    i = 0;
    for (; i < len; ++i) {
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

async function* embedTrackIterator(xpathGenerator) {
  if (isMultiTrackEmbed(xpathGenerator)) {
    yield* playMultiTracks(xpathGenerator);
  } else {
    yield selectElemFromAndClick(document, selectors.singleTrackEmbedPlay);
  }
}

window.$WRIterator$ = embedTrackIterator(xpg);
window.$WRIteratorHandler$ = async function() {
  const results = await $WRIterator$.next();
  return { done: results.done, wait: results.value };
};
