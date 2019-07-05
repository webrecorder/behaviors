import * as lib from '../../lib';
import * as selectors from './selectors';

/**
 * An abstraction around interacting with HTML of a tweet in a timeline.
 *
 *  Selector, element breakdown:
 *    div.tweet.js-stream-tweet... (_container)
 *     |- div.content (aTweet, _tweet)
 *         |- div.stream-item-footer (_footer)
 *             |- div.ProfileTweet-action--reply (_tRplyAct)
 *                 |- button[data-modal="ProfileTweet-reply"] (_rplyButton)
 *                     |- span.ProfileTweet-actionCount--isZero (IFF no replied)
 *    |- div.self-thread-tweet-cta
 *        |- a.js-nav.show-thread-link
 */

export const elemIds = {
  permalinkOverlay: 'permalink-overlay',
};

export const dataAttrs = {
  itemType: 'item-type',
};

export const StreamHasMoreTweetsCSSClz = 'has-more-items';

export function notRealTweet(tweetLi) {
  if (lib.hasClass(tweetLi, selectors.AdaptiveSearchTimelineClz)) return true;
  // separated-module has-profile-promoted-tweet
  if (lib.hasClass(tweetLi, selectors.SeparatedModuleClz)) return true;
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

/**
 * @desc Xpath query used to traverse each tweet within a timeline.
 *
 * During visiting tweets, the tweets are marked as visited by adding the
 * sentinel`$wrvisited$` to the classList of a tweet seen during timeline traversal,
 * normal usage of a CSS selector and `document.querySelectorAll` is impossible
 * unless significant effort is made in order to ensure each tweet is seen only
 * once during timeline traversal.
 *
 * Tweets in a timeline have the following structure:
 *  div.tweet.js-stream-tweet.js-actionable-tweet.js-profile-popup-actionable.dismissible-content...
 *    |- div.content
 *       |- ...
 *  div.tweet.js-stream-tweet.js-actionable-tweet.js-profile-popup-actionable.dismissible-content...
 *   |- div.content
 *      |- ...
 *
 * We care only about the minimal identifiable markers of a tweet:
 *  div.tweet.js-stream-tweet...
 *   |- div.content
 *
 * such that when a tweet is visited during timeline traversal it becomes:
 *  div.tweet.js-stream-tweet...
 *   |- div.content.wrvistited
 *
 * which invalidates the query on subsequent evaluations against the DOM,
 * thus allowing for unique traversal of each tweet in a timeline.
 * @type {string}
 */
export const tweetXpath =
  '//div[starts-with(@class,"tweet js-stream-tweet")]/div[@class="content" and not(contains(@class, "wrvistited"))]';

export const threadedTweetXpath =
  '//div[@id="permalink-overlay"]//div[starts-with(@class,"tweet permalink-tweet") and not(contains(@class, "wrvistited"))]';

/**
 * @desc A variation of {@link tweetXpath} in that it is further constrained
 * to only search tweets within the overlay that appears when you click on
 * a tweet
 * @type {string}
 */
export const overlayTweetXpath = `//div[@id="permalink-overlay"]${tweetXpath}`;

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
