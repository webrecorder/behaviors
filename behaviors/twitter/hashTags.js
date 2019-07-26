import * as lib from '../../lib';
import * as selectors from './selectors';
import * as shared from './shared';
import autoScrollBehavior from '../autoscroll';

/**
 * @desc Clicks (views) the currently visited tweet
 * @param {HTMLElement|Element} tweetContainer
 * @return {Promise<?Element>}
 */
async function openTweet(tweetContainer) {
  const permalinkPath = tweetContainer.dataset.permalinkPath;
  // logger.log(`tweet has perlinkPath = ${permalinkPath}`);
  const wasClicked = await lib.clickAndWaitFor(tweetContainer, () =>
    document.baseURI.endsWith(permalinkPath)
  );
  if (wasClicked.clicked) {
    // the overlay was opened
    return lib.id(selectors.permalinkOverlayId);
  }
  return null;
}

/**
 * @desc Closes the overlay representing viewing a tweet
 * @return {Promise<{predicate: boolean, maxExceeded: boolean, clicked: boolean}>}
 */
async function closeTweetOverlay(originalBaseURI) {
  const overlay = lib.qs(selectors.closeFullTweetSelector);
  if (!overlay) return Promise.resolve(false);
  return lib.clickAndWaitFor(
    overlay,
    () => document.baseURI === originalBaseURI
  );
}

async function* handleTweetStreamItem(
  tweetStreamLI,
  { originalBaseURI, reporter }
) {
  if (lib.selectorExists(selectors.sensativeMediaDiv)) {
    await shared.revealSensitiveMedia(tweetStreamLI);
  }
  lib.collectOutlinksFrom(tweetStreamLI);

  if (lib.hasClass(tweetStreamLI, selectors.userProfileInStream)) {
    return lib.stateWithMsgNoWait('Encountered a non-tweet', reporter);
  }
  const streamTweetDiv = tweetStreamLI.firstElementChild;
  const tweetContent = lib.qs(selectors.tweetInStreamContent, streamTweetDiv);
  const permalink = streamTweetDiv.dataset.permalinkPath;
  let video = lib.qs(selectors.tweetVideo, tweetStreamLI);
  if (video) {
    await lib.noExceptPlayMediaElement(video);
    yield reporter.viewingTweetWithVideo(permalink);
  } else {
    yield reporter.viewingTweet(permalink);
  }
  const footer = lib.qs(selectors.tweetFooterSelector, tweetContent);
  const replyAction = lib.qs(selectors.replyActionSelector, footer);
  const replyButton = lib.qs(selectors.replyBtnSelector, replyAction);
  const hasReplies = lib.selectorExists(
    selectors.noReplySpanSelector,
    replyButton
  );
  const apartOfThread = lib.selectorExists(
    selectors.threadSelector,
    tweetContent
  );

  await lib.scrollIntoViewWithDelay(tweetContent);

  const tweetPermalinkOverlay = await openTweet(streamTweetDiv);
  if (!tweetPermalinkOverlay) return;

  await shared.postOpenTweet(tweetPermalinkOverlay, video);

  if (hasReplies || apartOfThread) {
    yield reporter.viewingTweetWithRepliesOrInThread(permalink);
    const nextElemSetQS = apartOfThread
      ? selectors.threadedConvMoreReplies
      : selectors.showMoreInThread;
    const baseMsg = apartOfThread
      ? 'Viewed threaded tweet'
      : 'Viewing tweet reply';

    yield* lib.mapAsyncIterator(
      lib.repeatedXpathQueryIteratorAsync(
        apartOfThread
          ? selectors.threadedTweetXpath
          : selectors.overlayTweetXpath,
        tweetPermalinkOverlay,
        () =>
          lib.selectElemFromAndClickWithDelay(
            tweetPermalinkOverlay,
            nextElemSetQS
          )
      ),
      shared.createThreadReplyVisitor(baseMsg, reporter)
    );
  }
  yield reporter.fullyViewedTweet(permalink);
  await closeTweetOverlay(originalBaseURI);
}

/**
 * @return {AsyncIterableIterator<*>}
 */
export default function hashTagIterator(cliAPI) {
  lib.autoFetchFromDoc();
  const { streamEnd, streamFail } = shared.getStreamIndicatorElems();
  const reporter = shared.makeReporter();
  return lib.traverseChildrenOfCustom({
    loader: true,
    additionalArgs: { reporter, originalBaseURI: document.baseURI },
    parentElement: lib.qs(selectors.tweetStreamItems),
    setupFailure: autoScrollBehavior,
    handler: handleTweetStreamItem,
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
    filter(tweetLi) {
      const shouldSkip = shared.notRealTweet(tweetLi);
      if (shouldSkip) {
        lib.scrollIntoView(tweetLi);
        lib.collectOutlinksFrom(tweetLi);
      }
      return !shouldSkip;
    },
    postTraversal(failure) {
      const msg = failure
        ? 'Failed to find tweet container, falling back'
        : 'Behavior finished';
      return lib.stateWithMsgNoWait(msg, reporter.counts);
    },
  });
}

export const metadata = {
  name: 'twitterHashTagsBehavior',
  displayName: 'Twitter Hashtag',
  match: {
    regex: /^(?:https:\/\/(?:www\.)?)?twitter\.com\/hashtag\/[^?]+.*/,
  },
  description:
    'Capture every tweet in hashtag search, including embedded videos, images and replies.',
  updated: '2019-07-23T17:13:14-04:00',
};

export const isBehavior = true;
