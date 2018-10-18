(async function timelineSetup(xpg, debug = false) {
  if (
    typeof xpg !== 'function' ||
    xpg.toString().indexOf('[Command Line API]') === -1
  ) {
    /**
     * @desc Polyfill console api $x
     * @param {string} xpathQuery
     * @param {Element | Document} startElem
     * @return {Array<HTMLElement>}
     */
    xpg = function(xpathQuery, startElem) {
      if (startElem == null) {
        startElem = document;
      }
      const snapShot = document.evaluate(
        xpathQuery,
        startElem,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      const elements = [];
      let i = 0;
      let len = snapShot.snapshotLength;
      while (i < len) {
        elements.push(snapShot.snapshotItem(i));
        i += 1;
      }
      return elements;
    };
  }

  if (document.getElementById('$wrStyle$') == null) {
    const style = document.createElement('style');
    style.id = '$wrStyle$';
    let sd = 'body, .wr-scroll-container { scroll-behavior: smooth }';
    if (debug) {
      sd += '.wr-debug-visited {border: 6px solid #3232F1;} .wr-debug-visited-thread-reply {border: 6px solid green;} .wr-debug-visited-overlay {border: 6px solid pink;} .wr-debug-click {border: 6px solid red;}';
    }
    style.innerText = sd;
    document.head.appendChild(style);
  }
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
   *   |- div.content.$wrvistited$
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

  function scrollTweetIntoView(aTweet, delayTime = 500) {
    aTweet.scrollIntoView({
      behavior: 'auto',
      block: 'center',
      inline: 'center'
    });
    return new Promise(r => setTimeout(r, delayTime));
  }

  function tweetLoadDelay(delayTime = 3000) {
    return new Promise(r => setTimeout(r, delayTime));
  }

  class Tweet {
    /**
     *
     * @param {HTMLElement} aTweet - The content div for a tweet in a timeline
     * @param {string} baseURI - The document.baseURI of the timeline page being viewed
     */
    constructor(aTweet, baseURI) {
      aTweet.classList.add('$wrvistited$');
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

    scrollIntoView() {
      return scrollTweetIntoView(this.tweet);
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
     * @return {Promise<void>}
     */
    openFullTweet() {
      this.container.click();
      const permalinkPath = this.permalinkPath();
      return new Promise(resolve => {
        let interval = setInterval(() => {
          if (document.baseURI.endsWith(permalinkPath)) {
            this.fullTweetOverlay = document.getElementById(
              'permalink-overlay'
            );
            if (debug) {
              this.fullTweetOverlay.classList.add('wr-debug-visited-overlay');
            }
            clearInterval(interval);
            resolve();
          }
        }, 1000);
      });
    }

    _getViewedTweetsSubTweets() {
      return document.evaluate(
        overlayTweetXpath,
        this.fullTweetOverlay,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
    }

    async *visitThreadReplyTweets() {
      let snapShot = this._getViewedTweetsSubTweets();
      let aTweet;
      let i, len;
      if (snapShot.snapshotLength === 0) return;
      do {
        len = snapShot.snapshotLength;
        i = 0;
        while (i < len) {
          aTweet = snapShot.snapshotItem(i);
          aTweet.classList.add('$wrvistited$');
          if (debug) {
            aTweet.classList.add('wr-debug-visited-thread-reply');
          }
          await scrollTweetIntoView(aTweet);
          yield aTweet;
          i += 1;
        }
        snapShot = this._getViewedTweetsSubTweets();
        if (snapShot.snapshotLength === 0) {
          this._maybeClickThreadShowMore();
          await tweetLoadDelay();
          snapShot = this._getViewedTweetsSubTweets();
        }
      } while (snapShot.snapshotLength > 0);
    }

    _maybeClickThreadShowMore() {
      const showMore = this.fullTweetOverlay.querySelector(
        'button.ThreadedConversation-showMoreThreadsButton'
      );
      if (showMore) {
        if (debug) {
          showMore.classList.add('wr-debug-click');
          showMore.click();
          showMore.classList.remove('wr-debug-click');
          return;
        }
        showMore.click();
      }
    }

    /**
     * @desc Closes the overlay representing viewing a tweet
     * @return {Promise<void>}
     */
    closeFullTweetOverlay() {
      const overlay = document.querySelector(closeFullTweetSelector);
      return new Promise((resolve, reject) => {
        if (!overlay) return resolve();
        if (debug) overlay.classList.add('wr-debug-click');
        overlay.click();
        let ninterval = setInterval(() => {
          if (document.baseURI === this._baseURI) {
            clearInterval(ninterval);
            if (debug) overlay.classList.remove('wr-debug-click');
            resolve();
          }
        }, 1000);
      });
    }
  }

  /**
   * @desc Determines if we can scroll the timeline any more
   * @return {boolean}
   */
  const canScrollMore = () =>
    window.scrollY + window.innerHeight <
    Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

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
   * @param {function(string): Array<HTMLElement>} xpathQuerySelector
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
        await aTweet.scrollIntoView();
        yield aTweet.tweet;
        if (aTweet.hasRepliedOrInThread()) {
          yield* aTweet.viewRepliesOrThread();
        } else {
          yield* aTweet.viewRegularTweet();
        }
      }
      tweets = xpathQuerySelector(tweetXpath);
      if (tweets.length === 0) {
        await tweetLoadDelay();
        tweets = xpathQuerySelector(tweetXpath);
      }
    } while (tweets.length > 0 && canScrollMore());
  }

  window.$WRTweetIterator$ = timelineIterator(xpg, document.baseURI);
  window.$WRIteratorHandler$ = async function () {
    const next = await $WRTweetIterator$.next();
    return next.done;
  };
})($x);
