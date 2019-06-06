import * as lib from '../../lib';
import {
  elemIds,
  overlayTweetXpath,
  selectors,
  threadedTweetXpath,
} from './shared';
import autoScrollBehavior from '../autoscroll';

let behaviorStyle;
if (debug) {
  behaviorStyle = lib.addBehaviorStyle(
    '.wr-debug-visited {border: 6px solid #3232F1;} .wr-debug-visited-thread-reply {border: 6px solid green;} .wr-debug-visited-overlay {border: 6px solid pink;} .wr-debug-click {border: 6px solid red;}'
  );
}

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
    const fullTweetOverlay = lib.id(elemIds.permalinkOverlay);
    if (debug) {
      lib.addClass(fullTweetOverlay, behaviorStyle.wrDebugVisitedOverlay);
    }
    return fullTweetOverlay;
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
  if (debug) lib.addClass(overlay, behaviorStyle.wrDebugClick);
  return lib.clickAndWaitFor(overlay, () => {
    const done = document.baseURI === originalBaseURI;
    if (done && debug) {
      lib.removeClass(overlay, behaviorStyle.wrDebugClick);
    }
    return done;
  });
}

async function* handleTweetStreamItem(tweetStreamLI, originalBaseURI) {
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
    if (debug) {
      lib.addClass(tweetStreamLI, behaviorStyle.wrDebugVisited);
    }
    yield lib.stateWithMsgNoWait('Encountered a non-tweet');
    return;
  }

  const streamTweetDiv = tweetStreamLI.firstElementChild;
  const tweetContent = lib.qs(selectors.tweetInStreamContent, streamTweetDiv);

  if (debug) {
    lib.addClass(streamTweetDiv, behaviorStyle.wrDebugVisited);
  }
  const videoContainer = tweetStreamLI.querySelector(
    'div.AdaptiveMedia-videoContainer'
  );
  if (videoContainer != null) {
    const video = videoContainer.querySelector('video');
    if (video) {
      yield lib.stateWithMsgWaitFromAwaitable(
        lib.noExceptPlayMediaElement(video),
        `Handled a tweet's video`
      );
    }
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

  lib.collectOutlinksFrom(tweetPermalinkOverlay);

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
    let totalRepliesThreads = 1;
    for await (var aTweet of lib.repeatedXpathQueryIteratorAsync(
      apartOfThread ? threadedTweetXpath : overlayTweetXpath,
      tweetPermalinkOverlay,
      () =>
        lib.selectElemFromAndClickWithDelay(
          tweetPermalinkOverlay,
          nextElemSetQS
        )
    )) {
      lib.markElemAsVisited(aTweet);
      lib.collectOutlinksFrom(aTweet);
      if (debug) {
        lib.addClass(aTweet, behaviorStyle.wrDebugVisitedThreadReply);
      }
      await lib.scrollIntoViewWithDelay(aTweet);
      yield lib.stateWithMsgNoWait(`${baseMsg} #${totalRepliesThreads}`);
      totalRepliesThreads += 1;
    }
  } else {
    yield lib.stateWithMsgNoWait('Viewing regular tweet');
  }

  await closeTweetOverlay(originalBaseURI);
}

/**
 * @return {AsyncIterableIterator<*>}
 */
export default async function* hashTagIterator(cliAPI) {
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
    'For each tweet containing the searched hashtag views each tweet. If the tweet has a video it is played and a wait until network idle is done. If the tweet is a part of a thread or has replies views all related tweets',
};

export const isBehavior = true;
