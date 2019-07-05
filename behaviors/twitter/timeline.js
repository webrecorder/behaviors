import * as lib from '../../lib';
import * as selectors from './selectors';
import * as shared from './shared';
import autoScrollBehavior from '../autoscroll';

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
  return lib.id(selectors.permalinkOverlayId);
}

function closeFullTweetOverlay(originalBaseURI) {
  const overlay = lib.qs(selectors.closeFullTweetSelector);
  if (!overlay) return Promise.resolve(false);
  return lib.clickAndWaitFor(overlay, () =>
    lib.docBaseURIEquals(originalBaseURI)
  );
}

/**
 *
 * @param {HTMLLIElement} tweetLi
 * @param {Object} args
 * @return {AsyncIterableIterator<*>}
 */
async function* handleTweet(tweetLi, { originalBaseURI }) {
  if (shared.isSensitiveTweet(tweetLi)) {
    await shared.revealSensitiveMedia(tweetLi);
  }
  const tweet = tweetLi.firstElementChild;
  const permalink = tweet.dataset.permalinkPath;
  yield lib.stateWithMsgNoWait(`Viewing tweet ${permalink}`);
  await lib.scrollIntoViewWithDelay(tweet);
  lib.collectOutlinksFrom(tweet);
  let video = lib.qs(selectors.tweetVideo, tweet);
  if (video) {
    yield lib.stateWithMsgWaitFromAwaitable(
      lib.noExceptPlayMediaElement(video),
      `Handled tweet's video`
    );
  }
  const fullTweetOverlay = await openFullTweet(tweet);
  if (!fullTweetOverlay) return;
  await shared.postOpenTweet(fullTweetOverlay, video);
  if (hasRepliedOrInThread(tweet)) {
    yield lib.stateWithMsgNoWait(
      `Viewing tweet ${permalink} threads or replies`
    );
    yield* lib.mapAsyncIterator(
      lib.repeatedXpathQueryIteratorAsync(
        selectors.overlayTweetXpath,
        fullTweetOverlay,
        () =>
          lib.selectElemFromAndClickWithDelay(
            fullTweetOverlay,
            selectors.showMoreInThread
          )
      ),
      shared.createThreadReplyVisitor(`Viewed tweet ${permalink} reply`)
    );
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
 * @return {AsyncIterator<*>}
 */
export default async function* timelineIterator(cliApi) {
  const { streamEnd, streamFail } = shared.getStreamIndicatorElems();
  return lib.traversal({
    loader: true,
    setupFailure: autoScrollBehavior,
    shouldWait(parentElement, curChild) {
      if (curChild.nextElementSibling != null) return false;
      if (lib.isElemVisible(streamEnd)) {
        return false;
      }
      return !lib.isElemVisible(streamFail);
    },
    wait(parentElement, curChild) {
      const previousChildCount = parentElement.childElementCount;
      return lib.waitForAdditionalElemChildrenMO(parentElement, {
        max: -1,
        pollRate: lib.secondsToDelayAmount(2.5),
        guard() {
          return (
            // twitter will let user know if things failed
            lib.isElemVisible(streamFail) ||
            // sanity check
            previousChildCount !== parentElement.childElementCount
          );
        },
      });
    },
    async setup() {
      if (shared.isSensitiveProfile()) {
        await shared.revealSensitiveProfile();
      }
      return lib.qs(selectors.tweetStreamItems);
    },
    handler: handleTweet,
    async filter(tweetLi) {
      const shouldSkip = shared.notRealTweet(tweetLi);
      if (shouldSkip) {
        await lib.scrollIntoViewWithDelay(tweetLi);
        lib.collectOutlinksFrom(tweetLi);
      }
      return !shouldSkip;
    },
    additionalArgs: {
      xpg: cliApi.$x,
      originalBaseURI: document.baseURI,
    },
  });
}

export const metaData = {
  name: 'twitterTimelineBehavior',
  match: {
    regex: /^(?:https:[/]{2}(?:www[.])?)?twitter[.]com[/]?(?:[^/]+[/]?)?$/,
  },
  description:
    'Capture every tweet, including embedded videos, images, replies and/or related tweets in thread.',
};

export const isBehavior = true;
