import * as lib from '../../lib';
import { annoyingElements, buttonSelectors, xpathQueries } from './shared';

const behaviorStyle = lib.addBehaviorStyle(
  '.wr-debug-visited {border: 6px solid #3232F1;}'
);

const delayTime = 1500;
const loadDelayTime = 3000;

let removedAnnoying = lib.maybeRemoveElemById(annoyingElements.pageletGrowthId);

async function clickLoadMoreReplies(tlItem) {
  const replies = lib.qs(buttonSelectors.moreReplies, tlItem);
  if (replies) {
    if (debug) replies.classList.add('wr-debug-visited');
    await lib.scrollIntoViewAndClickWithDelay(replies, delayTime);
    return true;
  }
  return false;
}

/**
 *
 * @param tlItem
 * @return {AsyncIterator<*>}
 */
async function* clickRepliesToReplies(tlItem) {
  let rToR = lib.qsa(buttonSelectors.repliesToRepliesA, tlItem);
  let i = 0;
  let length = rToR.length;
  let rtr;
  while (i < length) {
    rtr = rToR[i];
    if (debug) lib.addClass(rtr, behaviorStyle.wrDebugVisited);
    await lib.scrollIntoViewAndClickWithDelay(rtr, delayTime);
    yield;
    i += 1;
  }
  rToR = lib.qsa(buttonSelectors.repliesToRepliesA, tlItem);
  if (rToR.length) {
    i = 0;
    length = rToR.length;
    while (i < length) {
      rtr = rToR[i];
      if (debug) lib.addClass(rtr, behaviorStyle.wrDebugVisited);
      await lib.scrollIntoViewAndClickWithDelay(rtr, delayTime);
      yield;
      i += 1;
    }
  }
}

/**
 * @desc Views each entry in a FB user feed
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
 * @param cliAPI
 * @return {AsyncIterator<*>}
 */
export default async function* initFBUserFeedBehaviorIterator(cliAPI) {
  let timelineItems = cliAPI.$x(xpathQueries.userTimelineItem);
  let tlItem;
  let replies;
  let i;
  let length;
  do {
    length = timelineItems.length;
    for (i = 0; i < length; i++) {
      tlItem = timelineItems[i];
      if (debug) tlItem.classList.add('wr-debug-visited');
      await lib.scrollIntoViewWithDelay(tlItem, delayTime);
      lib.markElemAsVisited(tlItem);
      lib.collectOutlinksFrom(tlItem);
      yield;
      replies = await clickLoadMoreReplies(tlItem);
      if (replies) {
        yield* clickRepliesToReplies(tlItem);
      }
    }
    timelineItems = cliAPI.$x(xpathQueries.userTimelineItem);
    if (timelineItems.length === 0) {
      await lib.scrollDownByElemHeightWithDelay(tlItem, loadDelayTime);
      timelineItems = cliAPI.$x(xpathQueries.userTimelineItem);
    }
  } while (timelineItems.length > 0 && lib.canScrollMore());
}

export const postStep = lib.buildCustomPostStepFn(() => {
  if (!removedAnnoying) {
    removedAnnoying = lib.maybeRemoveElemById(annoyingElements.pageletGrowthId);
  }
});

export const metaData = {
  name: 'facebookUserFeed',
  match: {
    regex: /^https:\/\/(www\.)?facebook\.com\/[^/]+\/?$/
  },
  description:
    'Views all items in the Facebook user/organization/artists/etc timeline'
};

export const isBehavior = true;
