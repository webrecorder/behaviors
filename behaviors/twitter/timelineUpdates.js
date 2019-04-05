import * as lib from '../../lib';
import { timelineUpdatesSelectors, timelineUpdatesMisc } from './shared';

lib.addBehaviorStyle(
  '.wr-debug-visited {border: 6px solid #3232F1;} .wr-debug-visited-thread-reply {border: 6px solid green;} .wr-debug-visited-overlay {border: 6px solid pink;} .wr-debug-click {border: 6px solid red;}'
);

const log = console.log;

function timeLineUpdatesGetTweetLoaderRoot() {
  const rootH3 = lib.qs(timelineUpdatesSelectors.userTweetsRootH3);
  if (rootH3 && rootH3.nextElementSibling) {
    const root = lib.chainFistChildElemOf(rootH3.nextElementSibling, 2);
    if (lib.isClasslessElem(root.firstElementChild)) {
      return root;
    }
  }
  return null;
}

function getActualTweet(tweetContainer) {
  const maybeTweet = lib.qs(
    timelineUpdatesSelectors.tweetWithinContainer,
    tweetContainer
  );
  if (maybeTweet != null && !lib.isElemNotVisible(maybeTweet)) {
    return maybeTweet;
  }
  return null;
}

function tweetInfo(aTweet) {
  const tweetActions = lib.qs(timelineUpdatesSelectors.tweetActions, aTweet);
  const repliesContainer = lib.qs(
    timelineUpdatesSelectors.replyAction,
    tweetActions
  );
  let hasReplies = false;
  if (
    repliesContainer != null &&
    timelineUpdatesMisc.numRepliesRegex.test(
      repliesContainer.getAttribute('aria-label')
    )
  ) {
    hasReplies = true;
  }
  let threaded = false;
  const bottomBar = lib.getElemSibling(aTweet);
  if (bottomBar != null) {
    lib.elemInnerTextEqs(bottomBar, timelineUpdatesMisc.showThisThread);
    threaded = true;
  }

  return { tweetActions, repliesContainer, hasReplies };
}

async function* handleThreadedTweet(container, aTweet) {
  const threadBar = lib.firstChildElementOf(lib.getElemSibling(aTweet));
}

async function* handleTweet(container, aTweet) {
  lib.addClass(container, 'wr-debug-visited');
  await lib.scrollIntoViewWithDelay(aTweet);
  yield;

  // if (isThreadedTweet(aTweet)) {
  //   yield* handleThreadedTweet(container, aTweet);
  // } else if (hasReplies(aTweet)) {
  // }
}

export async function* newTwitterUserTimelineBehavior(xpathGenerator) {
  const tweetLoaderRoot = timeLineUpdatesGetTweetLoaderRoot();
  let tweetContainer = tweetLoaderRoot.firstElementChild;
  let numLoadedTweets;
  let aTweet;
  while (tweetContainer != null) {
    // for promoted tweets etc aTweet will be null
    aTweet = getActualTweet(tweetContainer);
    if (aTweet != null) {
      yield* handleTweet(tweetContainer, aTweet);
    }
    numLoadedTweets = lib.numElemChildren(tweetLoaderRoot);
    if (!lib.elemHasSibling(tweetContainer)) {
      // logger.log('waiting for more tweets');
      await lib.waitForAdditionalElemChildren(tweetLoaderRoot, numLoadedTweets);
    }
    tweetContainer = lib.getElemSibling(tweetContainer);
  }
}

// export const isBehavior = true;
