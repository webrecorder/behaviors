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

async function* handleTweetStreamItem(tweetStreamLI, originalBaseURI) {
  if (lib.selectorExists(selectors.sensativeMediaDiv)) {
    await shared.revealSensitiveMedia(tweetStreamLI);
  }
  lib.collectOutlinksFrom(tweetStreamLI);

  if (lib.hasClass(tweetStreamLI, selectors.userProfileInStream)) {
    yield lib.stateWithMsgNoWait('Encountered a non-tweet');
    return;
  }

  const streamTweetDiv = tweetStreamLI.firstElementChild;
  const tweetContent = lib.qs(selectors.tweetInStreamContent, streamTweetDiv);

  let video = lib.qs(selectors.tweetVideo, tweetStreamLI);
  if (video) {
    await lib.noExceptPlayMediaElement(video);
    yield lib.stateWithMsgWait(`Handled tweet's video`);
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
    yield lib.stateWithMsgNoWait(
      apartOfThread ? 'Viewing threaded tweet' : "Viewing a tweet's replies"
    );
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
      shared.createThreadReplyVisitor(baseMsg)
    );
  } else {
    yield lib.stateWithMsgNoWait('Viewing regular tweet');
  }
  await closeTweetOverlay(originalBaseURI);
}

/**
 * @return {AsyncIterableIterator<*>}
 */
export default function hashTagIterator(cliAPI) {
  lib.autoFetchFromDoc();
  const { streamEnd, streamFail } = shared.getStreamIndicatorElems();
  return lib.traverseChildrenOfCustom({
    loader: true,
    additionalArgs: document.baseURI,
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
  });
}

export const metaData = {
  name: 'twitterHashTagsBehavior',
  match: {
    regex: /^(?:https:\/\/(?:www\.)?)?twitter\.com\/hashtag\/[^?]+.*/,
  },
  description:
    'Capture every tweet in hashtag search, including embedded videos, images and replies.',
};

export const isBehavior = true;
