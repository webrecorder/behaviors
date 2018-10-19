import { delay } from '../utils/delays';
import {
  addBehaviorStyle,
  markElemAsVisited,
  maybePolyfillXPG,
  xpathSnapShot
} from '../utils/dom';
import { canScrollMore, scrollIntoViewWithDelay } from '../utils/scrolls';
import { clickAndWaitFor, selectElemFromAndClick } from '../utils/clicks';
import OLC from '../utils/outlinkCollector';

addBehaviorStyle(
  '.wr-debug-visited {border: 6px solid #3232F1;} .wr-debug-visited-thread-reply {border: 6px solid green;} .wr-debug-visited-overlay {border: 6px solid pink;} .wr-debug-click {border: 6px solid red;}'
);

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
const tweetFooterSelector = 'div.stream-item-footer';
const replyActionSelector = 'div.ProfileTweet-action--reply';
const noReplySpanSelector = 'span.ProfileTweet-actionCount--isZero';
const replyBtnSelector = 'button[data-modal="ProfileTweet-reply"]';
const closeFullTweetSelector = 'div.PermalinkProfile-dismiss > span';
const threadSelector = 'a.js-nav.show-thread-link';

/**
 * @desc Xpath query used to traverse each tweet within a timeline.
 *
 * Because {@link timelineIterator} marks each tweet as visited by adding the
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
const tweetXpath =
  '//div[starts-with(@class,"tweet js-stream-tweet")]/div[@class="content"]';

/**
 * @desc A variation of {@link tweetXpath} in that it is further constrained
 * to only search tweets within the overlay that appears when you click on
 * a tweet
 * @type {string}
 */
const overlayTweetXpath = `//div[@id="permalink-overlay"]${tweetXpath}`;

class Tweet {
  /**
   *
   * @param {HTMLElement} aTweet - The content div for a tweet in a timeline
   * @param {string} baseURI - The document.baseURI of the timeline page being viewed
   */
  constructor(aTweet, baseURI) {
    markElemAsVisited(aTweet);
    this.tweet = aTweet;
    this.container = aTweet.parentElement;
    this.dataset = this.container.dataset;
    this.footer = this.tweet.querySelector(tweetFooterSelector);
    this.tRplyAct = this.footer.querySelector(replyActionSelector);
    this.rplyButton = this.tRplyAct.querySelector(replyBtnSelector);

    this.fullTweetOverlay = null;

    /**
     * @desc If the currently visited tweet has replies then the span with
     * class `ProfileTweet-actionCount--isZero` must not exist
     * @type {boolean}
     * @private
     */
    this._hasReplys =
      this.rplyButton.querySelector(noReplySpanSelector) == null;
    /**
     * @desc If the currently visited tweet is apart of a thread,
     * then an a tag will be present with classes `js-nav.show-thread-link`
     * @type {boolean}
     * @private
     */
    this._apartThread = this.tweet.querySelector(threadSelector) != null;

    this._baseURI = baseURI;
  }

  tweetId() {
    return this.dataset.tweetId;
  }

  permalinkPath() {
    return this.dataset.permalinkPath;
  }

  hasReplys() {
    return this._hasReplys;
  }

  apartOfThread() {
    return this._apartThread;
  }

  hasRepliedOrInThread() {
    return this.hasReplys() || this.apartOfThread();
  }

  /**
   * @desc Clicks (views) the currently visited tweet
   * @return {AsyncIterator<HTMLElement>}
   */
  async *viewRepliesOrThread() {
    await this.openFullTweet();
    yield* this.visitThreadReplyTweets();
    await this.closeFullTweetOverlay();
  }

  async *viewRegularTweet() {
    await this.openFullTweet();
    yield this.fullTweetOverlay;
    await this.closeFullTweetOverlay();
  }

  /**
   * @desc Clicks (views) the currently visited tweet
   * @return {Promise<boolean>}
   */
  openFullTweet() {
    const permalinkPath = this.permalinkPath();
    return clickAndWaitFor(this.container, () => {
      const done = document.baseURI.endsWith(permalinkPath);
      if (done) {
        this.fullTweetOverlay = document.getElementById('permalink-overlay');
        if (debug) {
          this.fullTweetOverlay.classList.add('wr-debug-visited-overlay');
        }
      }
      return done;
    });
  }

  async *visitThreadReplyTweets() {
    OLC.collectFrom(this.fullTweetOverlay);
    let snapShot = xpathSnapShot(overlayTweetXpath, this.fullTweetOverlay);
    let aTweet;
    let i, len;
    if (snapShot.snapshotLength === 0) return;
    do {
      len = snapShot.snapshotLength;
      i = 0;
      while (i < len) {
        aTweet = snapShot.snapshotItem(i);
        markElemAsVisited(aTweet);
        if (debug) {
          aTweet.classList.add('wr-debug-visited-thread-reply');
        }
        await scrollIntoViewWithDelay(aTweet, 500);
        yield aTweet;
        i += 1;
      }
      snapShot = xpathSnapShot(overlayTweetXpath, this.fullTweetOverlay);
      if (snapShot.snapshotLength === 0) {
        if (
          selectElemFromAndClick(
            this.fullTweetOverlay,
            'button.ThreadedConversation-showMoreThreadsButton'
          )
        ) {
          await delay();
        }
        snapShot = xpathSnapShot(overlayTweetXpath, this.fullTweetOverlay);
      }
    } while (snapShot.snapshotLength > 0);
  }

  /**
   * @desc Closes the overlay representing viewing a tweet
   * @return {Promise<boolean>}
   */
  closeFullTweetOverlay() {
    const overlay = document.querySelector(closeFullTweetSelector);
    if (!overlay) return Promise.resolve(false);
    if (debug) overlay.classList.add('wr-debug-click');
    return clickAndWaitFor(overlay, () => {
      const done = document.baseURI === this._baseURI;
      if (done && debug) {
        overlay.classList.remove('wr-debug-click');
      }
      return done;
    });
  }
}

/**
 * @desc For a more detailed explanation about the relationship between the xpath
 * query used and the marking of each tweet as visited by this algorithm see the
 * description for {@link tweetXpath}.
 *
 * (S1) Build initial set of to be visited tweets
 * (S2) For each tweet visible at current scroll position:
 *      - mark as visited
 *      - scroll into view
 *      - yield tweet
 *      - if should view full tweet (has replies or apart of thread)
 *        - yield all sub tweets
 * (S3) Once all tweets at current scroll position have been visited:
 *      - wait for Twitter to load more tweets (if any more are to be had)
 *      - if twitter added more tweets add them to the to be visited set
 * (S4) If we have more tweets to visit and can scroll more:
 *      - GOTO S2
 *
 * @param {function(string,): Array<HTMLElement>} xpathQuerySelector
 * @param {string} baseURI - The timelines documents baseURI
 * @return {AsyncIterator<HTMLElement>}
 */
async function* timelineIterator(xpathQuerySelector, baseURI) {
  let tweets = xpathQuerySelector(tweetXpath);
  let aTweet;
  do {
    while (tweets.length > 0) {
      aTweet = new Tweet(tweets.shift(), baseURI);
      if (debug) {
        aTweet.tweet.classList.add('wr-debug-visited');
      }
      await scrollIntoViewWithDelay(aTweet.tweet, 500);
      OLC.collectFrom(aTweet.tweet);
      yield aTweet.tweet;
      if (aTweet.hasRepliedOrInThread()) {
        yield* aTweet.viewRepliesOrThread();
      } else {
        yield* aTweet.viewRegularTweet();
      }
    }
    tweets = xpathQuerySelector(tweetXpath);
    if (tweets.length === 0) {
      await delay();
      tweets = xpathQuerySelector(tweetXpath);
    }
  } while (tweets.length > 0 && canScrollMore());
}

window.$WRTweetIterator$ = timelineIterator(
  maybePolyfillXPG(xpg),
  document.baseURI
);
window.$WRIteratorHandler$ = async function() {
  const next = await $WRTweetIterator$.next();
  return next.done;
};
