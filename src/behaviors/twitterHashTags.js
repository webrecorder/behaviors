import {
  addBehaviorStyle,
  addClass,
  hasClass,
  id,
  markElemAsVisited,
  maybePolyfillXPG,
  qs,
  removeClass,
  xpathSnapShot
} from '../utils/dom';
import { scrollIntoViewWithDelay } from '../utils/scrolls';
import { delay, waitForAdditionalElemChildren } from '../utils/delays';
import { collectOutlinksFrom } from '../utils/outlinkCollector';
import { clickAndWaitFor, selectElemFromAndClick } from '../utils/clicks';
import {
  elemIds,
  getNoneNukedConsole,
  overlayTweetXpath,
  selectors,
  threadedTweetXpath
} from '../shared/twitter';
import runBehavior from '../shared/behaviorRunner';

addBehaviorStyle(
  '.wr-debug-visited {border: 6px solid #3232F1;} .wr-debug-visited-thread-reply {border: 6px solid green;} .wr-debug-visited-overlay {border: 6px solid pink;} .wr-debug-click {border: 6px solid red;}'
);

// const logger = getNoneNukedConsole();

/**
 * @desc Clicks (views) the currently visited tweet
 * @param {HTMLElement|Element} tweetContainer
 * @return {Promise<?Element>}
 */
async function openTweet(tweetContainer) {
  const permalinkPath = tweetContainer.dataset.permalinkPath;
  // logger.log(`tweet has perlinkPath = ${permalinkPath}`);
  const wasClicked = await clickAndWaitFor(tweetContainer, () =>
    document.baseURI.endsWith(permalinkPath)
  );
  if (wasClicked) {
    // the overlay was opened
    const fullTweetOverlay = id(elemIds.permalinkOverlay);
    if (debug) {
      addClass(fullTweetOverlay, 'wr-debug-visited-overlay');
    }
    return fullTweetOverlay;
  }
  return null;
}

/**
 * @desc Closes the overlay representing viewing a tweet
 * @return {Promise<boolean>}
 */
async function closeTweetOverlay(originalBaseURI) {
  const overlay = qs(selectors.closeFullTweetSelector);
  if (!overlay) return Promise.resolve(false);
  if (debug) addClass(overlay, 'wr-debug-click');
  return clickAndWaitFor(overlay, () => {
    const done = document.baseURI === originalBaseURI;
    if (done && debug) {
      removeClass(overlay, 'wr-debug-click');
    }
    return done;
  });
}

async function* vistReplies(fullTweetOverlay) {
  let snapShot = xpathSnapShot(overlayTweetXpath, fullTweetOverlay);
  let aTweet;
  let i, len;
  // logger.log(`we have ${snapShot.snapshotLength} replies`);
  if (snapShot.snapshotLength === 0) return;
  do {
    len = snapShot.snapshotLength;
    i = 0;
    while (i < len) {
      aTweet = snapShot.snapshotItem(i);
      // logger.log('visting reply or thread tweet', aTweet);
      markElemAsVisited(aTweet);
      collectOutlinksFrom(aTweet);
      if (debug) {
        addClass(aTweet, 'wr-debug-visited-thread-reply');
      }
      await scrollIntoViewWithDelay(aTweet);
      yield false;
      i += 1;
    }
    snapShot = xpathSnapShot(overlayTweetXpath, fullTweetOverlay);
    if (snapShot.snapshotLength === 0) {
      if (
        selectElemFromAndClick(fullTweetOverlay, selectors.showMoreInThread)
      ) {
        await delay();
      }
      snapShot = xpathSnapShot(overlayTweetXpath, fullTweetOverlay);
    }
  } while (snapShot.snapshotLength > 0);
}

async function* vistThreadedTweet(fullTweetOverlay) {
  // logger.log('in vistThreadedTweet', fullTweetOverlay);
  // logger.log('visiting tweets that are apart of the thread');
  let snapShot = xpathSnapShot(threadedTweetXpath, fullTweetOverlay);
  let aTweet;
  let i, len;
  // logger.log(`we have ${snapShot.snapshotLength} replies`);
  if (snapShot.snapshotLength === 0) return;
  do {
    len = snapShot.snapshotLength;
    i = 0;
    while (i < len) {
      aTweet = snapShot.snapshotItem(i);
      // logger.log('visting reply or thread tweet', aTweet);
      markElemAsVisited(aTweet);
      collectOutlinksFrom(aTweet);
      if (debug) {
        addClass(aTweet, 'wr-debug-visited-thread-reply');
      }
      await scrollIntoViewWithDelay(aTweet);
      yield false;
      i += 1;
    }
    snapShot = xpathSnapShot(threadedTweetXpath, fullTweetOverlay);
    if (snapShot.snapshotLength === 0) {
      if (
        selectElemFromAndClick(
          fullTweetOverlay,
          selectors.threadedConvMoreReplies
        )
      ) {
        await delay();
      }
      snapShot = xpathSnapShot(threadedTweetXpath, fullTweetOverlay);
    }
  } while (snapShot.snapshotLength > 0);
}

/**
 * @param {HTMLLIElement | Element} tweetStreamLI
 * @param {string} originalBaseURI
 * @return {AsyncIterator<boolean>}
 */
async function* handleTweet(tweetStreamLI, originalBaseURI) {
  const notTweet = hasClass(tweetStreamLI, selectors.userProfileInStream);
  if (notTweet) {
    if (debug) {
      addClass(tweetStreamLI, 'wr-debug-visited');
    }
    collectOutlinksFrom(tweetStreamLI);
    await scrollIntoViewWithDelay(tweetStreamLI);
    yield false;
    return;
  }

  const streamTweetDiv = tweetStreamLI.firstElementChild;
  const tweetContent = qs(selectors.tweetInStreamContent, streamTweetDiv);
  // logger.log('Tweet content', tweetContent);
  if (debug) {
    addClass(streamTweetDiv, 'wr-debug-visited');
  }
  const videoContainer = tweetStreamLI.querySelector(
    'div.AdaptiveMedia-videoContainer'
  );
  if (videoContainer != null) {
    const video = videoContainer.querySelector('video');
    if (video) {
      try {
        await video.play();
        yield true;
      } catch (e) {
        yield false;
      }
    }
  }
  const footer = qs(selectors.tweetFooterSelector, tweetContent);
  const replyAction = qs(selectors.replyActionSelector, footer);
  const replyButton = qs(selectors.replyBtnSelector, replyAction);

  const hasReplies = qs(selectors.noReplySpanSelector, replyButton) == null;
  const apartOfThread = qs(selectors.threadSelector, tweetContent) != null;

  await scrollIntoViewWithDelay(tweetContent);
  collectOutlinksFrom(tweetContent);
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
    collectOutlinksFrom(tweetPermalinkOverlay);
    yield false;
  }
  // logger.log('closing tweet overlay');
  await closeTweetOverlay(originalBaseURI);
}
/**
 * @param originalBaseURI
 * @return {AsyncIterableIterator<boolean>}
 */
async function* hashTagIterator(originalBaseURI) {
  const streamItems = qs(selectors.tweetStreamItems);
  let tweetLI = streamItems.firstElementChild;
  let numLoadedTweets = streamItems.children.length;
  while (tweetLI != null) {
    markElemAsVisited(tweetLI);
    if (tweetLI.getBoundingClientRect().height !== 0) {
      if (hasClass(tweetLI, 'AdaptiveSearchTimeline-separationModule')) {
        await scrollIntoViewWithDelay(tweetLI);
        collectOutlinksFrom(tweetLI);
        yield false;
      } else {
        yield* handleTweet(tweetLI, originalBaseURI);
      }
    }
    numLoadedTweets = streamItems.children.length;
    if (tweetLI.nextElementSibling == null) {
      // logger.log('waiting for more tweets');
      await waitForAdditionalElemChildren(streamItems, numLoadedTweets);
    }
    // logger.log('getting next tweet');
    tweetLI = tweetLI.nextElementSibling;
  }
}

runBehavior(window, hashTagIterator(document.baseURI), state => ({
  done: state.done,
  wait: !!state.value
}));

//
// async function run() {
//   for await (const tweet of window.$WRTweetIterator$) {
//     logger.log(tweet);
//   }
// }
//
// run().catch(error => console.error(error));
