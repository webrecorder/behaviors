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
    await lib.noExceptPlayMediaElement(video);
    yield lib.stateWithMsgWait(`Handled tweet's video`);
  }
  await lib.clickAndWaitFor(tweet, () => lib.docBaseURIEndsWith(permalink), {
    max: 60000,
  });
  const fullTweetOverlay = lib.id(selectors.permalinkOverlayId);
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
  const closeOverlay = lib.qs(
    selectors.closeFullTweetSelector,
    fullTweetOverlay
  );
  if (closeOverlay) {
    await lib.clickAndWaitFor(closeOverlay, () =>
      lib.docBaseURIEquals(originalBaseURI)
    );
  }
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
export default function timelineIterator(cliApi) {
  const { streamEnd, streamFail } = shared.getStreamIndicatorElems();
  return lib.traverseChildrenOfCustom({
    loader: true,
    setupFailure: autoScrollBehavior,
    handler: handleTweet,
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
            lib.isElemVisible(streamEnd) ||
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
    filter(tweetLi) {
      const shouldSkip = shared.notRealTweet(tweetLi);
      if (shouldSkip) {
        lib.scrollIntoView(tweetLi);
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

export const metadata = {
  name: 'twitterTimelineBehavior',
  match: {
    regex: /^(?:https:[/]{2}(?:www[.])?)?twitter[.]com[/]?(?:[^/]+[/]?)?$/,
  },
  description:
    'Capture every tweet, including embedded videos, images, replies and/or related tweets in thread.',
  updated: '2019-07-10T10:32:26',
};

export const isBehavior = true;
