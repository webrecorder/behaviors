import * as std from '../../lib';
import { annoyingElements, xpathQueries } from './shared';

const behaviorClasses = std.addBehaviorStyle(
  '.wr-debug-visited {border: 6px solid #3232F1;}'
);

const scrollDelay = 1500;

/**
 * @desc Views each entry in a FB news
 * @steps
 *  - S1: Build initial set of to be feed items
 *  - S2: For each feed item visible at current scroll position:
 *      - mark as visited
 *      - scroll into view
 *      - yield feed item
 *  - S3: Once all feed items at pager set have been visited:
 *      - wait for FB to load more feed items (if any more are to be had)
 *      - if FB has added more feed items add them to the to be visited set
 *  - S4: If we have more feed items to visit and can scroll more:
 *      - GOTO S2
 * @param {function (query: string, start?: HTMLElement): Array<HTMLElement>} xpathG
 * @return {AsyncIterator<*>}
 */
export default async function* initFBNewsFeedBehaviorIterator(xpathG) {
  const getFeedItems = query => xpathG(query);
  let feedItems = getFeedItems(xpathQueries.feedItem);
  let feedItem;
  let i;
  let length;
  do {
    length = feedItems.length;
    for (i = 0; i < length; i++) {
      feedItem = feedItems[i];
      if (debug) {
        std.addClass(feedItem, behaviorClasses.wrDebugVisited);
      }
      await std.scrollToElemOffsetWithDelay(feedItem, scrollDelay);
      std.markElemAsVisited(feedItem);
      std.collectOutlinksFrom(feedItem);
      yield;
    }
    feedItems = getFeedItems(xpathQueries.feedItem);
    if (feedItems.length === 0) {
      await std.delay();
      feedItems = getFeedItems(xpathQueries.feedItem);
    }
  } while (feedItems.length > 0 && std.canScrollMore());
}

let removedAnnoying = std.maybeRemoveElemById(annoyingElements.pageletGrowthId);

export const postStep = std.buildCustomPostStepFn(() => {
  if (!removedAnnoying) {
    removedAnnoying = std.maybeRemoveElemById(annoyingElements.pageletGrowthId);
  }
});

export const metaData = {
  name: 'facebookNewsFeed',
  match: {
    regex: /^https:\/\/(www\.)?facebook\.com(\/)?([?]sk=nf)?$/
  },
  description: 'Views all items in the Facebook news feed'
};

export const isBehavior = true;
