export const selectors = {
  tweetStreamContainer: 'div.stream-container',
  tweetStreamDiv: 'div.stream',
  tweetInStreamContent: 'div.content',
  tweetStreamItems: 'ol.stream-items',
  tweetFooterSelector: 'div.stream-item-footer',
  replyActionSelector: 'div.ProfileTweet-action--reply',
  noReplySpanSelector: 'span.ProfileTweet-actionCount--isZero',
  replyBtnSelector: 'button[data-modal="ProfileTweet-reply"]',
  closeFullTweetSelector: 'div.PermalinkProfile-dismiss > span',
  threadSelector: 'a.js-nav.show-thread-link',
  userProfileInStream: 'AdaptiveStreamUserGallery-user',
  userProfileContent: 'div.AdaptiveStreamUserGallery-user',
  showMoreInThread: 'button.ThreadedConversation-showMoreThreadsButton',
  tweetPermalinkContainer: 'div.permalink-container',
  tweetPermalinkRepliesContainer: 'ol.stream-items',
  threadedConvMoreReplies: 'a.ThreadedConversation-moreRepliesLink',
  tweetVideo: 'div.AdaptiveMedia-videoContainer > video'
};

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
  permalinkOverlay: 'permalink-overlay'
};

export const dataAttrs = {
  itemType: 'item-type'
};

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

export function isStreamLiDataItemTypeTweet(streamLi) {
  return !!(streamLi.dataset && streamLi.dataset.itemType === 'tweet');
}

export const timelineUpdatesSelectors = {
  userTweetsRootH3: 'h3[dir="auto"]',
  tweetWithinContainer: 'article',
  tweetActions: 'div[aria-label="Tweet actions"]',
  replyAction: 'div[aria-label~="Reply"]'
};

export const timelineUpdatesMisc = {
  showThisThreadText: 'Show this thread',
  numRepliesRegex: /[0-9]+\sReply/
};

export const timelineUpdatesXpaths = {
  showThisThread: '//div[text()="Show this thread"]'
};
