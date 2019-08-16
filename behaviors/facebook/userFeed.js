import * as lib from '../../lib';
import * as selectors from './selectors';

let behaviorStyle;
if (debug) {
  behaviorStyle = lib.addBehaviorStyle(
    '.wr-debug-visited {border: 6px solid #3232F1;}'
  );
}

const delayTime = 1500;

let removedAnnoying = lib.maybeRemoveElemById(selectors.PageletGrowthId);

async function* walkUserTimeline() {
  let items = lib.xpathSnapShot(selectors.UserTimelineItemXPath);
  while (items.snapshotLength) {
    for (let i = 0; i < items.snapshotLength; ++i) {
      yield items.snapshotItem(i);
    }
    items = lib.xpathSnapShot(selectors.UserTimelineItemXPath);
    if (items.snapshotLength === 0) {
      const feedPlaceHolder = lib.qs(selectors.UserFeedMore);
      if (feedPlaceHolder && feedPlaceHolder.isConnected) {
        // scroll the placeholder feed item into view in order
        // to initiate the loading of more elements
        lib.scrollIntoView(feedPlaceHolder);
        // once the new feed items are loaded, the feed place holder
        // will be removed
        await lib.waitUntilElementIsRemovedFromDom(feedPlaceHolder);
      } else {
        await lib.delay();
      }
      items = lib.xpathSnapShot(selectors.UserTimelineItemXPath);
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
  const state = { videos: 0, posts: 0 };
  for await (const timelineItem of walkUserTimeline()) {
    state.posts++;
    await lib.scrollIntoViewWithDelay(timelineItem, delayTime);
    lib.markElemAsVisited(timelineItem);
    lib.collectOutlinksFrom(timelineItem);
    const playVideo = lib.qs(selectors.PlayVideoSelector, timelineItem);
    let wait = false;
    if (playVideo) {
      wait = true;
      state.videos++;
      await lib.clickWithDelay(playVideo);
    }
    let moreCommentsLoaded = 0;
    // the load more comments/replies element is removed once clicked
    // thus we need only to continually select all of the currently rendered
    // ones and click them
    for (const loadMoreComments of lib.repeatedQSAIterator(
      selectors.MoreCommentsSelector,
      timelineItem
    )) {
      await lib.scrollIntoViewAndClickWithDelay(loadMoreComments);
      yield lib.stateWithMsgWait(
        `Loaded more comments ${++moreCommentsLoaded} time for feed item ${
          state.posts
        }`,
        state
      );
    }
    yield lib.createState(wait, `Viewed feed item ${state.posts}`, state);
  }
  return lib.stateWithMsgNoWait('Behavior done', state);
}

export const postStep = lib.buildCustomPostStepFn(() => {
  if (!removedAnnoying) {
    removedAnnoying = lib.maybeRemoveElemById(selectors.PageletGrowthId);
  }
});

export const metadata = {
  name: 'facebookUserFeed',
  displayName: 'Facebook Page',
  match: {
    regex: /^https?:\/\/(www\.)?facebook\.com\/[^/]+\/?$/,
  },
  description:
    'Capture all items and comments in the Facebook page and scroll down to load more content where possible.',
  updated: '2019-08-21T16:17:10-04:00',
};

export const isBehavior = true;
