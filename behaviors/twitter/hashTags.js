import * as lib from '../../lib';
import {
  elemIds,
  overlayTweetXpath,
  selectors,
  threadedTweetXpath,
} from './shared';

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

async function* vistReplies(fullTweetOverlay) {
  let snapShot = lib.xpathSnapShot(overlayTweetXpath, fullTweetOverlay);
  let aTweet;
  let i, len;
  let totalReplies = 0;
  yield lib.stateWithMsgNoWait('Viewing tweet with replies');
  // logger.log(`we have ${snapShot.snapshotLength} replies`);
  if (snapShot.snapshotLength === 0) return;
  do {
    len = snapShot.snapshotLength;
    i = 0;
    while (i < len) {
      aTweet = snapShot.snapshotItem(i);
      // logger.log('visting reply or thread tweet', aTweet);
      lib.markElemAsVisited(aTweet);
      lib.collectOutlinksFrom(aTweet);
      if (debug) {
        lib.addClass(aTweet, behaviorStyle.wrDebugVisitedThreadReply);
      }
      await lib.scrollIntoViewWithDelay(aTweet);
      yield lib.stateWithMsgNoWait(`Viewing tweet reply #${totalReplies}`);
      totalReplies += 1;
      i += 1;
    }
    snapShot = lib.xpathSnapShot(overlayTweetXpath, fullTweetOverlay);
    if (snapShot.snapshotLength === 0) {
      if (
        lib.selectElemFromAndClick(fullTweetOverlay, selectors.showMoreInThread)
      ) {
        await lib.delay();
      }
      snapShot = lib.xpathSnapShot(overlayTweetXpath, fullTweetOverlay);
    }
  } while (snapShot.snapshotLength > 0);
}

async function* vistThreadedTweet(fullTweetOverlay) {
  // logger.log('in vistThreadedTweet', fullTweetOverlay);
  // logger.log('visiting tweets that are apart of the thread');
  let snapShot = lib.xpathSnapShot(threadedTweetXpath, fullTweetOverlay);
  let aTweet;
  let i, len;
  let totalThreadedReplies = 0;
  yield lib.stateWithMsgNoWait('Viewing threaded tweet');
  // logger.log(`we have ${snapShot.snapshotLength} replies`);
  if (snapShot.snapshotLength === 0) return;
  do {
    len = snapShot.snapshotLength;
    i = 0;
    while (i < len) {
      aTweet = snapShot.snapshotItem(i);
      // logger.log('visting reply or thread tweet', aTweet);
      lib.markElemAsVisited(aTweet);
      lib.collectOutlinksFrom(aTweet);
      if (debug) {
        lib.addClass(aTweet, behaviorStyle.wrDebugVisitedThreadReply);
      }
      await lib.scrollIntoViewWithDelay(aTweet);
      yield lib.stateWithMsgNoWait(
        `Viewed threaded tweets reply #${totalThreadedReplies}`
      );
      totalThreadedReplies += 1;
      i += 1;
    }
    snapShot = lib.xpathSnapShot(threadedTweetXpath, fullTweetOverlay);
    if (snapShot.snapshotLength === 0) {
      if (
        lib.selectElemFromAndClick(
          fullTweetOverlay,
          selectors.threadedConvMoreReplies
        )
      ) {
        await lib.delay();
      }
      snapShot = lib.xpathSnapShot(threadedTweetXpath, fullTweetOverlay);
    }
  } while (snapShot.snapshotLength > 0);
}

/**
 * @param {HTMLLIElement | Element} tweetStreamLI
 * @param {string} originalBaseURI
 * @return {AsyncIterator<*>}
 */
async function* handleTweet(tweetStreamLI, originalBaseURI) {
  const notTweet = lib.hasClass(tweetStreamLI, selectors.userProfileInStream);
  if (notTweet) {
    if (debug) {
      lib.addClass(tweetStreamLI, behaviorStyle.wrDebugVisited);
    }
    lib.collectOutlinksFrom(tweetStreamLI);
    await lib.scrollIntoViewWithDelay(tweetStreamLI);
    yield lib.stateWithMsgNoWait('Encountered a non-tweet');
    return;
  }

  const streamTweetDiv = tweetStreamLI.firstElementChild;
  const tweetContent = lib.qs(selectors.tweetInStreamContent, streamTweetDiv);
  // logger.log('Tweet content', tweetContent);
  if (debug) {
    lib.addClass(streamTweetDiv, behaviorStyle.wrDebugVisited);
  }
  const videoContainer = tweetStreamLI.querySelector(
    'div.AdaptiveMedia-videoContainer'
  );
  if (videoContainer != null) {
    const video = videoContainer.querySelector('video');
    if (video) {
      const wasPlayed = await lib.noExceptPlayMediaElement(video);
      yield lib.stateWithMsgWait(
        `${wasPlayed ? 'Played' : 'Could not play'} a tweets video`
      );
    }
  }
  const footer = lib.qs(selectors.tweetFooterSelector, tweetContent);
  const replyAction = lib.qs(selectors.replyActionSelector, footer);
  const replyButton = lib.qs(selectors.replyBtnSelector, replyAction);

  const hasReplies = lib.qs(selectors.noReplySpanSelector, replyButton) == null;
  const apartOfThread = lib.qs(selectors.threadSelector, tweetContent) != null;

  await lib.scrollIntoViewWithDelay(tweetContent);
  lib.collectOutlinksFrom(tweetContent);
  // yield tweet;
  // logger.log('opening tweet overlay');
  const tweetPermalinkOverlay = await openTweet(streamTweetDiv);
  // logger.log(tweetPermalinkOverlay);
  // logger.log('opened tweet');
  if (hasReplies) {
    // logger.log('visiting replies');
    yield* vistReplies(tweetPermalinkOverlay);
  } else if (apartOfThread) {
    yield* vistThreadedTweet(tweetPermalinkOverlay);
  } else {
    lib.collectOutlinksFrom(tweetPermalinkOverlay);
    yield lib.stateWithMsgNoWait('View regular tweet');
  }
  // logger.log('closing tweet overlay');
  await closeTweetOverlay(originalBaseURI);
}
/**
 * @return {AsyncIterableIterator<boolean>}
 */
export default async function* hashTagIterator() {
  const originalBaseURI = document.baseURI;
  const streamItems = lib.qs(selectors.tweetStreamItems);
  let tweetLI = streamItems.firstElementChild;
  let numLoadedTweets = streamItems.children.length;
  while (tweetLI != null) {
    lib.markElemAsVisited(tweetLI);
    if (tweetLI.getBoundingClientRect().height !== 0) {
      if (lib.hasClass(tweetLI, 'AdaptiveSearchTimeline-separationModule')) {
        await lib.scrollIntoViewWithDelay(tweetLI);
        lib.collectOutlinksFrom(tweetLI);
        yield false;
      } else {
        yield* handleTweet(tweetLI, originalBaseURI);
      }
    }
    numLoadedTweets = streamItems.children.length;
    if (tweetLI.nextElementSibling == null) {
      // logger.log('waiting for more tweets');
      await lib.waitForAdditionalElemChildren(streamItems, numLoadedTweets);
    }
    // logger.log('getting next tweet');
    tweetLI = tweetLI.nextElementSibling;
  }
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
