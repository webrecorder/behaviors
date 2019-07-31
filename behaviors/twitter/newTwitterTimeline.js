import * as lib from '../../lib';
import * as selectors from './selectors';
import * as shared from './shared';

const mainRoleMain = 'main[role="main"]';
const ProfileTimelineNav = 'nav[aria-label="Profile timelines"';
const TimelineStart = 'div[aria-label*="Timeline: "]';
const TweetHeading = 'h2[role="heading"]';
const WhoToFollowHeaderText = 'who to follow';
const PromotedTweetHeaderText = 'promoted tweet';
const H2ElemName = 'h2';

function isStyleAndClassLessElem(elem) {
  if (!elem) return false;
  return elem.classList.length + elem.style.length === 0;
}

function initInfo() {
  const timelineStart = lib.qs(TimelineStart);
  const whoesTweets = lib.elemInnerText(
    lib.firstChildElemOfParent(timelineStart),
    true
  );
  const betterTimelineStartSelector = timelineStart
    ? `div[aria-label="${lib.attr(timelineStart, 'aria-label')}"]`
    : TimelineStart;
  const info = {
    ownTL: true,
    numTweets: -1,
    whom: 'Your',
    whoesTweets,
    getTimelineRoot() {
      const tlstart = lib.qs(betterTimelineStartSelector);
      return tlstart.firstElementChild.firstElementChild;
    },
  };
  if (!whoesTweets.includes('Your')) {
    info.ownTL = false;
    const whoesTimelineDiv = 'div[role="presentation"]';
    const whoesTlDiv = lib.qs(whoesTimelineDiv);
    info.whom = lib.elemInnerText(
      lib.chainFistChildElemOf(whoesTlDiv, 5),
      true
    );
    // h2 > whoesTlDiv;
    // div > text([0-9]+ Tweets)
    const howManyTweets = lib.elemInnerText(
      lib.getElemsParentsSibling(whoesTlDiv),
      true
    );
    info.numTweets =
      (howManyTweets && Number(howManyTweets.split(' ')[0])) || -1;
  }
  return info;
}

async function* handleTweet(aTweet) {
  // TODO(n0tan3rd): handle a tweet
}

var TwitterTimelineTypes = {
  empty: Symbol('empty'),
  promotedTweet: Symbol('promoted-tweet'),
  whoToFollowHeading: Symbol('who-to-follow-heading'),
  junk: Symbol('non-tweet'),
  tweet: Symbol('tweet'),
};

function determineTimelineItemType(tweetContainer) {
  if (
    // safety p1
    !tweetContainer ||
    // safety p2
    tweetContainer.childElementCount === 0 ||
    // empty separator right before who to follow
    tweetContainer.firstElementChild.childElementCount === 0 ||
    // regular separator
    tweetContainer.firstElementChild.firstElementChild.childElementCount === 0
  ) {
    return TwitterTimelineTypes.empty;
  }

  // check for the cases when the current timeline item is a promoted tweet
  // or twitter indicating to the user it is about to suggest users to follow
  const maybeHeading = lib.qs(TweetHeading, tweetContainer);
  if (lib.elemInnerTextEqsInsensitive(maybeHeading, PromotedTweetHeaderText, true)) {
    return TwitterTimelineTypes.promotedTweet;
  }
  if (lib.elemInnerTextEqsInsensitive(maybeHeading, WhoToFollowHeaderText, true)) {
    return TwitterTimelineTypes.whoToFollowHeading;
  }
  // TODO(n0tan3rd): finish flushing out
  // if (lib.qs(TweetHeading, secondChild)) {
  //   return TwitterTimelineTypes.promotedOrWhoToFollow;
  // }
  return TwitterTimelineTypes.tweet;
}

export default async function* timelineIterator(cliApi) {
  const info = initInfo();
  let currentTimelineRoot = info.getTimelineRoot();
  let currentViewedTweetContainer = currentTimelineRoot.firstElementChild;
  let aTweet;
  while (true) {
    // TODO(n0tan3rd): update with new timeline types
    switch (determineTimelineItemType(currentViewedTweetContainer)) {
      case TwitterTimelineTypes.empty:
        yield lib.stateWithMsgNoWait('Encountered twitter junk');
        break;
      case TwitterTimelineTypes.promotedOrWhoToFollow:
        yield lib.stateWithMsgNoWait(
          `Encountered ${lib.innerTextOfSelected(
            TweetHeading,
            currentViewedTweetContainer
          )}`
        );
        break;
      case TwitterTimelineTypes.tweet:
        const tweetTime = lib.qs('time', currentViewedTweetContainer);
        const tweetLinkElem = tweetTime.parentElement;
        const tweetSelector = `a[href="${tweetLinkElem.pathname}"]`;
        console.log(tweetSelector);
        const tlLocation = window.location.href;
        yield lib.stateWithMsgNoWait(
          `Viewing tweet ${tweetTime.dateTime} ${tweetLinkElem.pathname}`
        );
        await lib.clickWithDelay(tweetLinkElem);
        await lib.browserHistoryGoBack(tlLocation);
        await lib.delay(1500);
        currentTimelineRoot = info.getTimelineRoot();
        currentViewedTweetContainer = lib.findDirectChildElement(
          currentTimelineRoot,
          someTweet => lib.selectorExists(tweetSelector, someTweet)
        );
        if (currentViewedTweetContainer == null) {
          console.log('fail fish');
          return lib.stateWithMsgNoWait('Failed to refind postion');
        }
        break;
    }
    if (!currentViewedTweetContainer.nextElementSibling) {
      await lib.waitForAdditionalElemChildren(
        currentTimelineRoot,
        currentTimelineRoot.childElementCount
      );
      currentViewedTweetContainer =
        currentViewedTweetContainer.nextElementSibling;
      if (!currentViewedTweetContainer) {
        return lib.stateWithMsgNoWait('done');
      }
    } else {
      currentViewedTweetContainer =
        currentViewedTweetContainer.nextElementSibling;
    }
  }
}

export const metadata = {
  name: 'twitterTimelineBehaviorNew',
  displayName: 'Twitter Timeline',
  match: {
    regex: /^(?:https?:[/]{2}(?:www[.])?)?twitter[.]com[/]?(?:[^/]+[/]?)?$/,
  },
  description:
    'Capture every tweet, including embedded videos, images, replies and/or related tweets in thread.',
  updated: '2019-07-23T17:13:14-04:00',
};

export const isBehavior = true;
