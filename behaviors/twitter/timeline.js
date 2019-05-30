import * as lib from '../../lib';
import { elemIds, overlayTweetXpath, selectors, tweetXpath } from './shared';

let behaviorStyle;
if (debug) {
  behaviorStyle = lib.addBehaviorStyle(
    '.wr-debug-visited {border: 6px solid #3232F1;} .wr-debug-visited-thread-reply {border: 6px solid green;} .wr-debug-visited-overlay {border: 6px solid pink;} .wr-debug-click {border: 6px solid red;}'
  );
}

function hasRepliedOrInThread(tweet) {
  const footer = lib.qs(selectors.tweetFooterSelector, tweet);
  const tRplyAct = lib.qs(selectors.replyActionSelector, footer);
  const rplyButton = lib.qs(selectors.replyBtnSelector, tRplyAct);
  return (
    !lib.selectorExists(selectors.noReplySpanSelector, rplyButton) ||
    lib.selectorExists(selectors.threadSelector, tweet)
  );
}

/**
 * @desc Clicks (views) the currently visited tweet
 * @param {Element} tweet
 * @return {Promise<Element>}
 */
async function openFullTweet(tweet) {
  const permalinkPath = tweet.dataset.permalinkPath;
  await lib.clickAndWaitFor(
    tweet,
    () => lib.docBaseURIEndsWith(permalinkPath),
    { max: 60000 }
  );
  const fullTweetOverlay = lib.id(elemIds.permalinkOverlay);
  if (debug) {
    lib.addClass(fullTweetOverlay, behaviorStyle.wrDebugVisitedOverlay);
  }
  return fullTweetOverlay;
}

function closeFullTweetOverlay(originalBaseURI) {
  const overlay = lib.qs(selectors.closeFullTweetSelector);
  if (!overlay) return Promise.resolve(false);
  if (debug) lib.addClass(overlay, behaviorStyle.wrDebugClick);
  return lib.clickAndWaitFor(overlay, () => {
    const done = lib.docBaseURIEquals(originalBaseURI);
    if (done && debug) {
      lib.removeClass(overlay, behaviorStyle.wrDebugClick);
    }
    return done;
  });
}

const shouldSkipTweet = tweetLi =>
  lib.hasClass(tweetLi, 'AdaptiveSearchTimeline-separationModule') ||
  tweetLi.getBoundingClientRect().height === 0;

/**
 *
 * @param {HTMLLIElement} tweetLi
 * @param {Object} args
 * @return {AsyncIterableIterator<*>}
 */
async function* handleTweet(tweetLi, { originalBaseURI }) {
  if (shouldSkipTweet(tweetLi)) {
    await lib.scrollIntoViewWithDelay(tweetLi);
    lib.collectOutlinksFrom(tweetLi);
    yield lib.stateWithMsgNoWait('Found a non tweet');
    return;
  }
  const tweet = tweetLi.firstElementChild;
  const permalink = tweet.dataset.permalinkPath;
  yield lib.stateWithMsgNoWait(`Viewing tweet ${permalink}`);
  if (debug) lib.addClass(tweet, behaviorStyle.wrDebugVisited);
  await lib.scrollIntoViewWithDelay(tweet);
  lib.collectOutlinksFrom(tweet);
  const video = lib.qs(selectors.tweetVideo, tweet);
  if (video) {
    yield lib.stateWithMsgWaitFromAwaitable(
      lib.noExceptPlayMediaElement(video),
      `Handled tweet's video`
    );
  }

  const fullTweetOverlay = await openFullTweet(tweet);
  if (!fullTweetOverlay) return;
  if (hasRepliedOrInThread(tweet)) {
    yield lib.stateWithMsgNoWait(
      `Viewing tweet ${permalink} threads or replies`
    );
    let totalSubTweets = 1;
    for await (var subTweet of lib.repeatedXpathQueryIteratorAsync(
      overlayTweetXpath,
      fullTweetOverlay,
      () =>
        lib.selectElemFromAndClickWithDelay(
          fullTweetOverlay,
          selectors.showMoreInThread
        )
    )) {
      yield lib.stateWithMsgNoWait(
        `Viewing sub tweet #${totalSubTweets} of tweet ${permalink}`
      );
      await lib.scrollIntoViewWithDelay(subTweet);
      lib.markElemAsVisited(subTweet);
      lib.collectOutlinksFrom(subTweet);
      if (debug) {
        lib.addClass(subTweet, behaviorStyle.wrDebugVisitedThreadReply);
      }
      totalSubTweets += 1;
    }
  }
  await closeFullTweetOverlay(originalBaseURI);
}

/**
 * @desc For a more detailed explanation about the relationship between the xpath
 * query used and the marking of each tweet as visited by this algorithm see the
 * description for {@link tweetXpath}.
 *
 * (S1) Build initial set of to be visited tweets
 * (S2) For each tweet visible at current scroll position:
 *      - mark as visited
 *      - scroll into view
 *      - yield tweet
 *      - if should view full tweet (has replies or apart of thread)
 *        - yield all sub tweets
 * (S3) Once all tweets at current scroll position have been visited:
 *      - wait for Twitter to load more tweets (if any more are to be had)
 *      - if twitter added more tweets add them to the to be visited set
 * (S4) If we have more tweets to visit and can scroll more:
 *      - GOTO S2
 *
 * @param {Object} cliApi
 * @return {AsyncIterator<boolean>}
 */
export default async function* timelineIterator(cliApi) {
  const originalBaseURI = document.baseURI;
  const streamItems = lib.qs(selectors.tweetStreamItems);
  // for each post row view the posts it contains
  yield* lib.traverseChildrenOfLoaderParent(streamItems, handleTweet, {
    xpg: cliApi.$x,
    originalBaseURI,
  });
}

export const metaData = {
  name: 'twitterTimelineBehavior',
  match: {
    regex: /^(?:https:\/\/(?:www\.)?)?twitter\.com\/[^/]+$/,
  },
  description:
    'For each tweet within the timeline views each tweet. If the tweet has a video it is played. If the tweet is a part of a thread or has replies views all related tweets',
};

export const isBehavior = true;
