import * as lib from '../../lib';
import { selectors, tweetXpath, overlayTweetXpath } from './shared';

if (debug) {
  lib.addBehaviorStyle(
    '.wr-debug-visited {border: 6px solid #3232F1;} .wr-debug-visited-thread-reply {border: 6px solid green;} .wr-debug-visited-overlay {border: 6px solid pink;} .wr-debug-click {border: 6px solid red;}'
  );
}

const contentPrior = window.__$$BPRIOR$$__ || 1;

class Tweet {
  /**
   *
   * @param {HTMLElement} aTweet - The content div for a tweet in a timeline
   * @param {string} baseURI - The document.baseURI of the timeline page being viewed
   */
  constructor(aTweet, baseURI) {
    lib.markElemAsVisited(aTweet);
    this.tweet = aTweet;
    this.container = aTweet.parentElement;
    this.dataset = this.container.dataset;
    this.footer = this.tweet.querySelector(selectors.tweetFooterSelector);
    this.tRplyAct = this.footer.querySelector(selectors.replyActionSelector);
    this.rplyButton = this.tRplyAct.querySelector(selectors.replyBtnSelector);

    this.fullTweetOverlay = null;

    /**
     * @desc If the currently visited tweet has replies then the span with
     * class `ProfileTweet-actionCount--isZero` must not exist
     * @type {boolean}
     * @private
     */
    this._hasReplys =
      this.rplyButton.querySelector(selectors.noReplySpanSelector) == null;
    /**
     * @desc If the currently visited tweet is apart of a thread,
     * then an a tag will be present with classes `js-nav.show-thread-link`
     * @type {boolean}
     * @private
     */
    this._apartThread =
      this.tweet.querySelector(selectors.threadSelector) != null;

    this._baseURI = baseURI;
  }

  /**
   * @return {?HTMLVideoElement}
   */
  tweetVideo() {
    const videoContainer = this.tweet.querySelector(
      'div.AdaptiveMedia-videoContainer'
    );
    if (videoContainer != null) {
      return videoContainer.querySelector('video');
    }
    return null;
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
   * @return {AsyncIterableIterator<boolean>}
   */
  async *viewRepliesOrThread(totalTweets) {
    await this.openFullTweet();
    yield* this.visitThreadReplyTweets(totalTweets);
    await this.closeFullTweetOverlay();
  }

  /**
   * @return {AsyncIterableIterator<*>}
   */
  async *viewRegularTweet(totalTweets) {
    await this.openFullTweet();
    yield lib.stateWithMsgNoWait(`Viewed tweet #${totalTweets}`);
    await this.closeFullTweetOverlay();
  }

  /**
   * @desc Clicks (views) the currently visited tweet
   * @return {Promise<*>}
   */
  openFullTweet() {
    const permalinkPath = this.permalinkPath();
    return lib.clickAndWaitFor(this.container, () => {
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

  /**
   * @return {AsyncIterableIterator<*>}
   */
  async *visitThreadReplyTweets(totalTweets) {
    lib.collectOutlinksFrom(this.fullTweetOverlay);
    let snapShot = lib.xpathSnapShot(overlayTweetXpath, this.fullTweetOverlay);
    let aTweet;
    let i, len;
    yield lib.stateWithMsgNoWait(`Viewing threaded tweet #${totalTweets}`);
    if (snapShot.snapshotLength === 0) return;
    let totalThreads = 0;
    do {
      len = snapShot.snapshotLength;
      i = 0;
      while (i < len) {
        totalThreads += 1;
        aTweet = snapShot.snapshotItem(i);
        lib.markElemAsVisited(aTweet);
        if (debug) {
          aTweet.classList.add('wr-debug-visited-thread-reply');
        }
        await lib.scrollIntoViewWithDelay(aTweet);
        yield lib.stateWithMsgNoWait(
          `Viewed thread #${totalThreads} of tweet #${totalTweets}`
        );
        i += 1;
      }
      snapShot = lib.xpathSnapShot(overlayTweetXpath, this.fullTweetOverlay);
      if (snapShot.snapshotLength === 0) {
        if (
          lib.selectElemFromAndClick(
            this.fullTweetOverlay,
            'button.ThreadedConversation-showMoreThreadsButton'
          )
        ) {
          await lib.delay();
        }
        snapShot = lib.xpathSnapShot(overlayTweetXpath, this.fullTweetOverlay);
      }
    } while (snapShot.snapshotLength > 0);
  }

  /**
   * @desc Closes the overlay representing viewing a tweet
   * @return {Promise<*>}
   */
  closeFullTweetOverlay() {
    const overlay = document.querySelector(selectors.closeFullTweetSelector);
    if (!overlay) return Promise.resolve(false);
    if (debug) overlay.classList.add('wr-debug-click');
    return lib.clickAndWaitFor(overlay, () => {
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
 * @param {Object} cliApi
 * @return {AsyncIterator<*>}
 */
export default async function* timelineIterator(cliApi) {
  const baseURI = document.baseURI;
  let tweets = cliApi.$x(tweetXpath);
  let aTweet;
  let totalTweets = 0;
  do {
    while (tweets.length > 0) {
      aTweet = new Tweet(tweets.shift(), baseURI);
      if (debug) {
        aTweet.tweet.classList.add('wr-debug-visited');
      }
      totalTweets += 1;
      await lib.scrollIntoViewWithDelay(aTweet.tweet, 500);
      lib.collectOutlinksFrom(aTweet.tweet);
      const tweetVideo = aTweet.tweetVideo();
      if (tweetVideo != null) {
        const played = await lib.noExceptPlayMediaElement(tweetVideo);
        const msg = `${
          played ? 'Played' : 'Could not play'
        } video of tweet #${totalTweets}`;

        yield lib.createState(played, msg);
      }
      if (contentPrior === 1) {
        if (aTweet.hasRepliedOrInThread()) {
          yield* aTweet.viewRepliesOrThread(totalTweets);
        } else {
          yield* aTweet.viewRegularTweet(totalTweets);
        }
      } else {
        yield* aTweet.viewRegularTweet(totalTweets);
      }
    }
    tweets = cliApi.$x(tweetXpath);
    if (tweets.length === 0) {
      await lib.delay();
      tweets = cliApi.$x(tweetXpath);
    }
  } while (tweets.length > 0 && lib.canScrollMore());
}

export const metaData = {
  name: 'twitterTimelineBehavior',
  match: {
    regex: /^(?:https:\/\/(?:www\.)?)?twitter\.com\/[^/]+$/
  },
  description:
    'For each tweet within the timeline views each tweet. If the tweet has a video it is played. If the tweet is a part of a thread or has replies views all related tweets',
  priorities: {
    1: 'Full behavior',
    2: 'No replies'
  }
};

export const isBehavior = true;
