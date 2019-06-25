import * as lib from '../../lib';
import * as selectors from './selectors';
import autoScrollBehavior from '../autoscroll';
import * as shared from './shared';

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
  await lib.scrollIntoViewWithDelay(tweetStreamLI);
  lib.markElemAsVisited(tweetStreamLI);
  lib.collectOutlinksFrom(tweetStreamLI);

  if (tweetStreamLI.getBoundingClientRect().height === 0) {
    yield lib.stateWithMsgNoWait(
      'Encountered an hidden item in the tweet feed'
    );
    return;
  } else if (
    lib.hasClass(tweetStreamLI, 'AdaptiveSearchTimeline-separationModule')
  ) {
    yield lib.stateWithMsgNoWait('Encountered tweet feed separator');
    return;
  } else if (lib.hasClass(tweetStreamLI, selectors.userProfileInStream)) {
    yield lib.stateWithMsgNoWait('Encountered a non-tweet');
    return;
  }

  const streamTweetDiv = tweetStreamLI.firstElementChild;
  const tweetContent = lib.qs(selectors.tweetInStreamContent, streamTweetDiv);

  let video = lib.qs(selectors.tweetVideo, tweetStreamLI);
  if (video) {
    yield lib.stateWithMsgWaitFromAwaitable(
      lib.noExceptPlayMediaElement(video),
      `Handled tweet's video`
    );
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
export default async function* hashTagIterator(cliAPI) {
  lib.autoFetchFromDoc();
  const originalBaseURI = document.baseURI;
  const streamItems = lib.qs(selectors.tweetStreamItems);
  if (!streamItems) {
    yield lib.stateWithMsgNoWait(
      'Could not find the tweets defaulting to auto scroll'
    );
    yield* autoScrollBehavior();
    return;
  }
  yield* lib.traverseChildrenOfLoaderParent(
    streamItems,
    handleTweetStreamItem,
    originalBaseURI
  );
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
