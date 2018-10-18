import {
  maybePolyfillXPG,
  markElemAsVisited,
  maybeRemoveElemById
} from '../utils/dom';
import { delay } from '../utils/delays';
import { scrollToElemOffsetWithDelay, canScrollMore } from '../utils/scrolls';

/**
 * @desc This xpath query is based on the fact that the first item in a FB news feed
 * is fixed and all other feed items are lazily loaded.  Each lazily loaded feed item
 * has `id="hyperfeed_story_id_5b90323a90ce80648983726"` but we do not care about
 * the `_[a-z0-9]+` portion of it. Like how we handle twitter feeds, a visited it is
 * marked by adding `$wrvisited$` to its classList so we look for elements with ids
 * starting with `hyperfeed_story_id` and their classList does not contain `$wrvisited$`
 * @type {string}
 */
const feedItemSelector =
  '//div[starts-with(@id,"hyperfeed_story_id") and not(contains(@class, "wrvistited"))]';

const scrollDelay = 1500;

const removeAnnoyingElemId = 'pagelet_growth_expanding_cta';

/**
 * @desc See description for {@link getFeedItems}
 * @param {HTMLElement} elem - The current
 * @returns {boolean}
 */
function newsFeedItemFilter(elem) {
  return elem.offsetTop !== 0;
}

/**
 * @desc Views each entry in a FB news.
 * (S1) Build initial set of to be feed items
 * (S2) For each feed item visible at current scroll position:
 *      - mark as visited
 *      - scroll into view
 *      - yield feed item
 * (S3) Once all feed items at pager set have been visited:
 *      - wait for FB to load more feed items (if any more are to be had)
 *      - if FB has added more feed items add them to the to be visited set
 * (S4) If we have more feed items to visit and can scroll more:
 *      - GOTO S2
 * @param {function (string, HTMLElement?): Array<HTMLElement>} xpathG
 * @returns {AsyncIterator<HTMLElement>}
 */
async function* makeIterator(xpathG) {
  const getFeedItems = query => xpathG(query).filter(newsFeedItemFilter);
  let feedItems = getFeedItems(feedItemSelector);
  let feedItem;
  do {
    while (feedItems.length > 0) {
      feedItem = feedItems.shift();
      await scrollToElemOffsetWithDelay(feedItem, scrollDelay);
      markElemAsVisited(feedItem);
      yield feedItem;
    }
    feedItems = getFeedItems(feedItemSelector);
    if (feedItems.length === 0) {
      await delay();
      feedItems = getFeedItems(feedItemSelector);
    }
  } while (feedItems.length > 0 && canScrollMore());
}

let removedAnnoying = maybeRemoveElemById(removeAnnoyingElemId);
window.$WRNFIterator$ = makeIterator(maybePolyfillXPG(xpg));
window.$WRIteratorHandler$ = async function() {
  if (!removedAnnoying) {
    removedAnnoying = maybeRemoveElemById(removeAnnoyingElemId);
  }
  const next = await $WRNFIterator$.next();
  return next.done;
};
