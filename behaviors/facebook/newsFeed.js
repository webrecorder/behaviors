import * as lib from '../../lib';
import { annoyingElements, xpathQueries } from './shared';

let behaviorClasses;
if (debug) {
  behaviorClasses = lib.addBehaviorStyle(
    '.wr-debug-visited {border: 6px solid #3232F1;}'
  );
}
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
 * @param {Object} cliAPI
 * @return {AsyncIterator<*>}
 */
export default async function* initFBNewsFeedBehaviorIterator(cliAPI) {
  const getFeedItems = query => cliAPI.$x(query);
  let feedItems = getFeedItems(xpathQueries.feedItem);
  let feedItem;
  let i;
  let length;
  let totalFeedItems = 0;
  let playVideo;
  const state = {
    videos: 0,
    posts: 0,
  };
  let wait = false;
  do {
    length = feedItems.length;
    for (i = 0; i < length; i++) {
      totalFeedItems += 1;
      feedItem = feedItems[i];
      if (debug) {
        lib.addClass(feedItem, behaviorClasses.wrDebugVisited);
      }
      await lib.scrollToElemOffsetWithDelay(feedItem, scrollDelay);
      lib.markElemAsVisited(feedItem);
      lib.collectOutlinksFrom(feedItem);
      playVideo = lib.qs('i > input[aria-label="Play video"]', feedItem);
      if (playVideo) {
        wait = true;
        state.videos++;
        await lib.clickWithDelay(playVideo);
      }
      yield lib.stateWithMsgNoWait(`Viewed feed item ${totalFeedItems}`, state);
      wait = false;
    }
    feedItems = getFeedItems(xpathQueries.feedItem);
    if (feedItems.length === 0) {
      await lib.delay();
      feedItems = getFeedItems(xpathQueries.feedItem);
    }
  } while (feedItems.length > 0 && lib.canScrollDownMore());
  return lib.stateWithMsgNoWait('Behavior done', state);
}

let removedAnnoying = lib.maybeRemoveElemById(annoyingElements.pageletGrowthId);

export const postStep = lib.buildCustomPostStepFn(() => {
  if (!removedAnnoying) {
    removedAnnoying = lib.maybeRemoveElemById(annoyingElements.pageletGrowthId);
  }
});

export const metadata = {
  name: 'facebookNewsFeed',
  displayName: 'Facebook Timeline',
  match: {
    regex: /^https?:\/\/(www\.)?facebook\.com(\/)?([?]sk=nf)?$/,
  },
  description:
    'Capture all items and comments in the Facebook timeline and scroll down to load more.',
  updated: '2019-07-24T15:42:03-04:00',
};

export const isBehavior = true;
