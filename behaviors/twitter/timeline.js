import * as lib from '../../lib';
import * as selectors from './selectors';
import * as shared from './shared';
import autoScrollBehavior from '../autoscroll';

let behaviorStyle;
if (debug) {
  behaviorStyle = lib.addBehaviorStyle(
    '.wr-debug-visited {border: 6px solid #3232F1;} .wr-debug-visited-thread-reply {border: 6px solid green;} .wr-debug-visited-overlay {border: 6px solid pink;} .wr-debug-click {border: 6px solid red;}'
  );
}

function hasRepliedOrInThread(tweet) {
  const footer = lib.qs(selectors.tweetFooterSelector, tweet);
  const tRplyAct = lib.qs(selectors.replyActionSelector, footer);
  const rplyButton = lib.qs(selectors.replyBtnSelector, tRplyAct);
  return (
    !lib.selectorExists(selectors.noReplySpanSelector, rplyButton) ||
    lib.selectorExists(selectors.threadSelector, tweet)
  );
}

/**
 * @desc Clicks (views) the currently visited tweet
 * @param {Element} tweet
 * @return {Promise<Element>}
 */
async function openFullTweet(tweet) {
  const permalinkPath = tweet.dataset.permalinkPath;
  await lib.clickAndWaitFor(
    tweet,
    () => lib.docBaseURIEndsWith(permalinkPath),
    { max: 60000 }
  );
  return lib.id(selectors.permalinkOverlayId);
}

function closeFullTweetOverlay(originalBaseURI) {
  const overlay = lib.qs(selectors.closeFullTweetSelector);
  if (!overlay) return Promise.resolve(false);
  return lib.clickAndWaitFor(overlay, () =>
    lib.docBaseURIEquals(originalBaseURI)
  );
}

const shouldSkipTweet = tweetLi =>
  lib.hasClass(tweetLi, 'AdaptiveSearchTimeline-separationModule') ||
  tweetLi.getBoundingClientRect().height === 0;

/**
 *
 * @param {HTMLLIElement} tweetLi
 * @param {Object} args
 * @return {AsyncIterableIterator<*>}
 */
async function* handleTweet(tweetLi, { originalBaseURI }) {
  if (shared.isSensitiveTweet(tweetLi)) {
    await shared.revealSensitiveMedia(tweetLi);
  }
  const tweet = tweetLi.firstElementChild;
  const permalink = tweet.dataset.permalinkPath;
  yield lib.stateWithMsgNoWait(`Viewing tweet ${permalink}`);
  await lib.scrollIntoViewWithDelay(tweet);
  lib.collectOutlinksFrom(tweet);
  let video = lib.qs(selectors.tweetVideo, tweet);
  if (video) {
    yield lib.stateWithMsgWaitFromAwaitable(
      lib.noExceptPlayMediaElement(video),
      `Handled tweet's video`
    );
  }
  const fullTweetOverlay = await openFullTweet(tweet);
  if (!fullTweetOverlay) return;
  await shared.postOpenTweet(fullTweetOverlay, video);
  if (hasRepliedOrInThread(tweet)) {
    yield lib.stateWithMsgNoWait(
      `Viewing tweet ${permalink} threads or replies`
    );
    yield* lib.mapAsyncIterator(
      lib.repeatedXpathQueryIteratorAsync(
        selectors.overlayTweetXpath,
        fullTweetOverlay,
        () =>
          lib.selectElemFromAndClickWithDelay(
            fullTweetOverlay,
            selectors.showMoreInThread
          )
      ),
      shared.createThreadReplyVisitor(
        `Viewed tweet ${permalink} reply`
      )
    );
  }
  await closeFullTweetOverlay(originalBaseURI);
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
  const originalBaseURI = document.baseURI;
  const streamItems = lib.qs(selectors.tweetStreamItems);
  if (shared.isSensitiveProfile()) {
    yield lib.stateWithMsgNoWait('Revealing sensitive profile');
    await shared.revealSensitiveProfile();
    yield lib.stateWithMsgNoWait('Revealed sensitive profile');
  }
  if (!streamItems) {
    yield lib.stateWithMsgNoWait(
      'Could not find the tweets defaulting to auto scroll'
    );
    yield* autoScrollBehavior();
    return;
  }
  // for each post row view the posts it contains
  yield* lib.traverseChildrenOfCustom({
    parentElement: streamItems,
    handler: handleTweet,
    loader: true,
    async filter(tweetLi) {
      const shouldSkip = shouldSkipTweet(tweetLi);
      if (shouldSkip) {
        await lib.scrollIntoViewWithDelay(tweetLi);
        lib.collectOutlinksFrom(tweetLi);
      }
      return !shouldSkip;
    },
    additionalArgs: {
      xpg: cliApi.$x,
      originalBaseURI,
    },
  });
}

export const metaData = {
  name: 'twitterTimelineBehavior',
  match: {
    regex: /^(?:https:[/]{2}(?:www[.])?)?twitter[.]com[/]?(?:[^/]+[/]?)?$/,
  },
  description:
    'Capture every tweet, including embedded videos, images, replies and/or related tweets in thread.',
};

export const isBehavior = true;
