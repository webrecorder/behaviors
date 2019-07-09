import * as lib from '../../lib';
import * as selectors from './selectors';

export function notRealTweet(tweetLi) {
  if (lib.hasClass(tweetLi, selectors.AdaptiveSearchTimelineClz)) return true;
  // separated-module has-profile-promoted-tweet
  if (lib.hasClass(tweetLi, selectors.SeparatedModuleClz)) return true;
  if (lib.hasClass(tweetLi.firstElementChild, selectors.PromotedTweet)) {
    return true;
  }
  return tweetLi.getBoundingClientRect().height === 0;
}

export function getStreamIndicatorElems() {
  const timelineEndDiv = lib.qs(selectors.timelineEndDiv);
  return {
    streamEnd: lib.qs('.stream-end', timelineEndDiv),
    streamLoading: lib.qs('.stream-loading', timelineEndDiv),
    streamFail: lib.qs('.stream-fail-container'),
  };
}

export function getNoneNukedConsole() {
  let consoleIframe;
  if (document.getElementById('$consoleIframe$') == null) {
    consoleIframe = document.createElement('iframe');
    consoleIframe.id = '$consoleIframe$';
    document.head.appendChild(consoleIframe);
  } else {
    consoleIframe = document.getElementById('$consoleIframe$');
  }
  return consoleIframe.contentWindow.console;
}

export function isSensitiveTweet(tweet) {
  const sensitiveDiv = lib.qs(selectors.sensativeMediaDiv, tweet);
  if (sensitiveDiv == null) return false;
  return window.getComputedStyle(sensitiveDiv).display !== 'none';
}

export function isSensitiveProfile() {
  const profileWarning = lib.qs(selectors.profileWarningHeader);
  if (profileWarning == null) return false;
  return window.getComputedStyle(profileWarning).display !== 'none';
}

export async function revealSensitiveMedia(tweet, delayTime) {
  await lib.selectAllAndClickWithDelay({
    selector: selectors.sensativeReveal,
    context: tweet,
    delayTime,
  });
}

export async function revealSensitiveProfile() {
  await lib.selectElemFromAndClickWithDelay(
    lib.qs(selectors.profileWarningHeader),
    selectors.profileWarningButton,
    1500
  );
}

export async function postOpenTweet(tweetOverlay, timelineVideo) {
  if (isSensitiveTweet(tweetOverlay)) {
    await revealSensitiveMedia(tweetOverlay);
  }
  if (timelineVideo) {
    await lib.selectAndPlay(selectors.tweetVideo, timelineVideo);
  }
  lib.collectOutlinksFrom(tweetOverlay);
}

export function createThreadReplyVisitor(baseMsg) {
  let totalRepliesThreads = 1;
  return async function handleThreadReplyTweets(subTweet) {
    if (isSensitiveTweet(subTweet)) {
      await revealSensitiveMedia(subTweet);
    }
    await lib.scrollIntoViewWithDelay(subTweet);
    lib.markElemAsVisited(subTweet);
    lib.collectOutlinksFrom(subTweet);
    let mediaPlayed = false;
    const subTweetVideo = lib.qs(selectors.tweetVideo, subTweet);
    if (subTweetVideo) {
      mediaPlayed = await lib.noExceptPlayMediaElement(subTweetVideo);
    }
    return lib.createState(mediaPlayed, `${baseMsg} #${totalRepliesThreads++}`);
  };
}

export function isStreamLiDataItemTypeTweet(streamLi) {
  return !!(streamLi.dataset && streamLi.dataset.itemType === 'tweet');
}

export const timelineUpdatesSelectors = {
  userTweetsRootH3: 'h3[dir="auto"]',
  tweetWithinContainer: 'article',
  tweetActions: 'div[aria-label="Tweet actions"]',
  replyAction: 'div[aria-label~="Reply"]',
};

export const timelineUpdatesMisc = {
  showThisThreadText: 'Show this thread',
  numRepliesRegex: /[0-9]+\sReply/,
};

export const timelineUpdatesXpaths = {
  showThisThread: '//div[text()="Show this thread"]',
};
