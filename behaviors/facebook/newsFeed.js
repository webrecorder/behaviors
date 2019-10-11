import * as lib from '../../lib';
import * as selectors from './selectors';

let behaviorClasses;
if (debug) {
  behaviorClasses = lib.addBehaviorStyle(
    '.wr-debug-visited {border: 6px solid #3232F1;}'
  );
}
const scrollDelay = 1500;

async function* walkNewsFeed() {
  let items = lib.xpathSnapShot(selectors.NewsFeedItemXPath);
  while (items.snapshotLength) {
    for (let i = 0; i < items.snapshotLength; ++i) {
      yield items.snapshotItem(i);
    }
    // attempt to get facebook to load more news feed items
    // after the current set of feed items have been considered
    lib.clickSelectedElementsNextElementSibling(
      selectors.NewsFeedPlaceHolderStory
    );
    items = lib.xpathSnapShot(selectors.NewsFeedItemXPath);
    if (items.snapshotLength === 0) {
      lib.clickSelectedElementsNextElementSibling(
        selectors.NewsFeedPlaceHolderStory
      );
      const feedPlaceHolder = lib.qs(selectors.NewsFeedLoadingMore);
      if (feedPlaceHolder && lib.isElemVisible(feedPlaceHolder)) {
        await lib.waitForElementToBecomeInvisible(feedPlaceHolder);
      } else {
        await lib.delay();
      }
      items = lib.xpathSnapShot(selectors.NewsFeedItemXPath);
    }
  }
}

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
  const state = { videos: 0, posts: 0 };
  for await (const feedItem of walkNewsFeed()) {
    state.posts++;
    await lib.scrollIntoViewWithDelay(feedItem, scrollDelay);
    lib.markElemAsVisited(feedItem);
    lib.collectOutlinksFrom(feedItem);
    const playVideo = lib.qs(selectors.PlayVideoSelector, feedItem);
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
      feedItem
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

let removedAnnoying = lib.maybeRemoveElemById(selectors.PageletGrowthId);

export const postStep = lib.buildCustomPostStepFn(() => {
  if (!removedAnnoying) {
    removedAnnoying = lib.maybeRemoveElemById(selectors.PageletGrowthId);
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
  updated: '2019-08-21T14:52:23-07:00',
};

export const isBehavior = true;
