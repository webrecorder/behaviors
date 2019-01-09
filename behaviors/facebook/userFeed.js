import * as std from '../../lib';
import { annoyingElements, buttonSelectors, xpathQueries } from './shared';

std.addBehaviorStyle('.wr-debug-visited {border: 6px solid #3232F1;}');

const delayTime = 1500;
const loadDelayTime = 3000;

let removedAnnoying = std.maybeRemoveElemById(annoyingElements.pageletGrowthId);

async function clickLoadMoreReplies(tlItem) {
  const replies = std.qs(buttonSelectors.moreReplies, tlItem);
  if (replies) {
    if (debug) replies.classList.add('wr-debug-visited');
    await std.scrollIntoViewAndClickWithDelay(replies, delayTime);
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
  let rToR = std.qsa(buttonSelectors.repliesToRepliesA, tlItem);
  let i = 0;
  let length = rToR.length;
  let rtr;
  while (i < length) {
    rtr = rToR[i];
    if (debug) rtr.classList.add('wr-debug-visited');
    await std.scrollIntoViewAndClickWithDelay(rtr, delayTime);
    yield;
    i += 1;
  }
  rToR = std.qsa(buttonSelectors.repliesToRepliesA, tlItem);
  if (rToR.length) {
    i = 0;
    length = rToR.length;
    while (i < length) {
      rtr = rToR[i];
      if (debug) rtr.classList.add('wr-debug-visited');
      await std.scrollIntoViewAndClickWithDelay(rtr, delayTime);
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
 * @param xpathGenerator
 * @return {AsyncIterator<*>}
 */
export default async function* initFBUserFeedBehaviorIterator(xpathGenerator) {
  let timelineItems = xpathGenerator(xpathQueries.userTimelineItem);
  let tlItem;
  let replies;
  let i;
  let length;
  do {
    length = timelineItems.length;
    for (i = 0; i < length; i++) {
      tlItem = timelineItems[i];
      if (debug) tlItem.classList.add('wr-debug-visited');
      await std.scrollIntoViewWithDelay(tlItem, delayTime);
      std.markElemAsVisited(tlItem);
      std.collectOutlinksFrom(tlItem);
      yield;
      replies = await clickLoadMoreReplies(tlItem);
      if (replies) {
        yield* clickRepliesToReplies(tlItem);
      }
    }
    timelineItems = xpathGenerator(xpathQueries.userTimelineItem);
    if (timelineItems.length === 0) {
      await std.scrollDownByElemHeightWithDelay(tlItem, loadDelayTime);
      timelineItems = xpathGenerator(xpathQueries.userTimelineItem);
    }
  } while (timelineItems.length > 0 && std.canScrollMore());
}

export const postStep = std.buildCustomPostStepFn(() => {
  if (!removedAnnoying) {
    removedAnnoying = std.maybeRemoveElemById(annoyingElements.pageletGrowthId);
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
