import * as lib from '../../lib';
import * as selectors from './selectors';

const MAX_WAIT = { max: 10000 };
const THEATER_READY_CLASS = 'pagingReady';
const FindTheaterPredicate = () => findTheater() != null;

/**
 * Attempts to select the popup theater used to display
 * a post or image
 * @return {?SomeElement}
 */
function findTheater() {
  // try the basic selector
  const theater = lib.qs(selectors.TheaterSelector);
  if (theater) return theater;
  // lastly try the currently known theater id
  return lib.id(selectors.TheaterId);
}

/**
 * Attempts to view a post or an image in the popup theater.
 * @param {SomeElement} timelineItem
 * @return {Promise<void>}
 */
export async function maybeViewPostOrImageInTheater(timelineItem) {
  const theaterItems = lib.qsa(selectors.TheaterItem, timelineItem);
  // if not theater items return
  if (!theaterItems.length) return;
  // the theater remains in the dom once created but not before
  let theater = findTheater();
  for (let i = 0; i < theaterItems.length; i++) {
    await lib.clickWithDelay(theaterItems[i]);
    if (!theater) {
      // first time we are viewing something in the theater so we
      // need to wait for it to be created
      await lib.waitForPredicate(FindTheaterPredicate, MAX_WAIT);
      theater = findTheater();
      // it was not created so we need to stop
      if (!theater) return;
    }
    if (!lib.hasClass(theater, THEATER_READY_CLASS)) {
      await lib.waitForPredicate(
        () => lib.hasClass(theater, THEATER_READY_CLASS),
        MAX_WAIT
      );
    }
    // lets give it a second after the theater is ready
    // before containing on
    await lib.delay(lib.DelayAmount1Second);
    await lib.selectElemFromAndClickWithDelay(theater, selectors.CloseTheater);
  }
}
