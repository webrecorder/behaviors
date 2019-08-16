export const tweetStreamContainer = 'div.stream-container';
export const tweetStreamDiv = 'div.stream';
export const tweetInStreamContent = 'div.content';
export const tweetStreamItems = 'ol.stream-items';
export const tweetFooterSelector = 'div.stream-item-footer';
export const replyActionSelector = 'div.ProfileTweet-action--reply';
export const noReplySpanSelector = 'span.ProfileTweet-actionCount--isZero';
export const replyBtnSelector = 'button[data-modal="ProfileTweet-reply"]';
export const closeFullTweetSelector = '.PermalinkProfile-dismiss > span';
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
export const PromotedTweet = 'promoted-tweet';
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

export const MainRoleMain = 'main[role="main"]';
export const PrimaryColumn = 'div[data-testid="primaryColumn"]';
export const ViewingWhatHeader = 'h2[dir="auto"][role="heading"]';
export const TestIdTweetDiv = 'div[data-testid="tweet"]';
export const TweetTextContainer = 'div[lang]';
export const ViewTweetImageAnchor = 'a[href*="/photo/"]';
export const ViewedTweetInSubTimeline =
  'article[role="article"][data-testid="tweetDetail"]';
export const ProfileTimelineNav =
  'nav[aria-label="profile timelines" i][role="navigation"]';
export const TimelineStart = 'div[aria-label*="Timeline: "]';
export const TweetHeading = 'h2[role="heading"]';
export const WhoToFollowHeaderText = 'who to follow';
export const PromotedTweetHeaderText = 'promoted tweet';
export const ShowThisThreadText = 'show this thread';
export const H2ElemName = 'h2';
export const SubTimelineConversationStart =
  'div[aria-label="timeline: conversation" i]';
export const BackToPreviousTimelinePart =
  'div[aria-label="Back"][role="button"]';
export const RepliesElem = 'div[aria-label*="reply" i][role="button"]';
export const LikesElem = 'div[aria-label*="like" i][role="button"]';
export const RewteetsElem = 'div[aria-label*="retweet" i][role="button"]';
export const ImagePopupCloser = 'div[aria-label="close" i][role="button"]';
export const ProgressBar = 'div[role="progressbar"]';
export const ImageProgressBar =
  'div[role="progressbar"][aria-valuetext*="loading image" i]';
export const ImageModalRoot =
  'div[aria-labelledby="modal-header"][aria-modal="true"]';
export const NextImage =
  'div[aria-label="Next"][role="button"][aria-disabled="false"]';
export const AlertDiv = 'div[role="alert"][data-testid="toast"]';

export const LostConnectionXpath =
  '//div[@dir="auto"]/span[contains(.,"lost your connection")]';

export const PromotedTweetSvgPath =
  'svg > g > path[d="M20.75 2H3.25C2.007 2 1 3.007 1 4.25v15.5C1 20.993 2.007 22 3.25 22h17.5c1.243 0 2.25-1.007 2.25-2.25V4.25C23 3.007 21.993 2 20.75 2zM17.5 13.504c0 .483-.392.875-.875.875s-.875-.393-.875-.876V9.967l-7.547 7.546c-.17.17-.395.256-.62.256s-.447-.086-.618-.257c-.342-.342-.342-.896 0-1.237l7.547-7.547h-3.54c-.482 0-.874-.393-.874-.876s.392-.875.875-.875h5.65c.483 0 .875.39.875.874v5.65z"]';

export const PromotedTweetTextXpath = 'count(./span[contains(., "Promoted")])';
export const ShowMoreOffensiveReplies =
  'count(./*[contains(., "Show additional replies, including those that may contain offensive content")])';
export const TweetIsUnavailableXpath =
  'count(./*[contains(., "This Tweet is unavailable")])';
