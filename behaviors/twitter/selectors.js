export const tweetStreamContainer = 'div.stream-container';
export const tweetStreamDiv = 'div.stream';
export const tweetInStreamContent = 'div.content';
export const tweetStreamItems = 'ol.stream-items';
export const tweetFooterSelector = 'div.stream-item-footer';
export const replyActionSelector = 'div.ProfileTweet-action--reply';
export const noReplySpanSelector = 'span.ProfileTweet-actionCount--isZero';
export const replyBtnSelector = 'button[data-modal="ProfileTweet-reply"]';
export const closeFullTweetSelector = 'div.PermalinkProfile-dismiss > span';
export const threadSelector = 'a.js-nav.show-thread-link';
export const userProfileInStream = 'AdaptiveStreamUserGallery-user';
export const userProfileContent = 'div.AdaptiveStreamUserGallery-user';
export const showMoreInThread =
  'button.ThreadedConversation-showMoreThreadsButton';
export const tweetPermalinkContainer = 'div.permalink-container';
export const tweetPermalinkRepliesContainer = 'ol.stream-items';
export const threadedConvMoreReplies = 'a.ThreadedConversation-moreRepliesLink';
export const tweetVideo = 'video';
export const tweetStreamFooter = 'div.stream-footer';

export const permalinkOverlayId = 'permalink-overlay';

export const StreamHasMoreTweetsCSSClz = 'has-more-items';

export const profileWarningHeader = 'div[class="profileWarningTimeline" i]';
export const profileWarningButton = 'button[class*="profileWarningTimeline" i]';
export const sensativeMediaDiv = 'div[class="tombstone" i]';
export const sensativeReveal = 'button[class*="tombstone-action" i]';

export const AdaptiveSearchTimelineClz =
  'AdaptiveSearchTimeline-separationModule';
export const SeparatedModuleClz = 'separated-module';

export const timelineEndDiv = '.stream-footer > .timeline-end';

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
