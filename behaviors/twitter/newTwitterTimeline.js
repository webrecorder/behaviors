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
  whoToFollow: Symbol('who-to-follow'),
  whoToFollowShowMore: Symbol('who-to-follow-show-more'),
  unknown: Symbol('unknown-timeline-item'),
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
  if (maybeHeading) {
    if (
      lib.elemInnerTextEqsInsensitive(
        maybeHeading,
        PromotedTweetHeaderText,
        true
      )
    ) {
      return TwitterTimelineTypes.promotedTweet;
    }
    if (
      lib.elemInnerTextEqsInsensitive(maybeHeading, WhoToFollowHeaderText, true)
    ) {
      return TwitterTimelineTypes.whoToFollowHeading;
    }
  }

  const secondChild = tweetContainer.firstElementChild.firstElementChild;
  // quick check for third child being an article and thus a tweet
  if (
    secondChild.firstElementChild &&
    secondChild.firstElementChild.localName === 'article'
  ) {
    return TwitterTimelineTypes.tweet;
  }
  // check for either a use to be followed or the show more users to follow link
  if (
    lib.elemMatchesSelector(secondChild, 'div[role="button"]') &&
    lib.elemDataValue(secondChild, 'testid') === 'UserCell'
  ) {
    return TwitterTimelineTypes.whoToFollow;
  }
  if (
    secondChild.localName === 'a' &&
    secondChild.pathname.includes('i/related')
  ) {
    return TwitterTimelineTypes.whoToFollowShowMore;
  }
  return TwitterTimelineTypes.unknown;
}

const defaultMessage = {
  [TwitterTimelineTypes.empty]: tweetContainer =>
    lib.stateWithMsgNoWait('Encountered twitter junk'),
  [TwitterTimelineTypes.promotedTweet]: tweetContainer =>
    lib.stateWithMsgNoWait('Encountered a promoted tweet'),
  [TwitterTimelineTypes.whoToFollowHeading]: tweetContainer =>
    lib.stateWithMsgNoWait(
      'Encountered start of twitters suggestion on who to follow'
    ),
  [TwitterTimelineTypes.whoToFollow]: tweetContainer =>
    lib.stateWithMsgNoWait(
      `Encountered start of twitters suggestion to follow - ${lib.innerTextOfSelected(
        'span',
        lib.qs('a[data-focusable="true"]', tweetContainer)
      ) || 'someone on twitter'}`
    ),
  [TwitterTimelineTypes.whoToFollowShowMore]: tweetContainer =>
    lib.stateWithMsgNoWait(
      'Encountered start of twitters link to show more people to follow on twitter'
    ),
  [TwitterTimelineTypes.unknown]: tweetContainer =>
    lib.stateWithMsgNoWait('Encountered an unknown twitter timeline element'),
};

const Reporter = {
  state: {
    tweets: 0,
    viewed: 0,
  },
  viewingTweet(dt, linkPath) {
    return lib.stateWithMsgNoWait(
      `Viewing tweet "${linkPath}" tweeted on ${dt}`,
      this.state
    );
  },
};

export default async function* timelineIterator(cliApi) {
  const info = initInfo();
  let currentTimelineRoot = info.getTimelineRoot();
  let currentViewedTweetContainer = currentTimelineRoot.firstElementChild;
  let timelineType;
  while (true) {
    timelineType = determineTimelineItemType(currentViewedTweetContainer);
    if (timelineType === TwitterTimelineTypes.tweet) {
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
        return lib.stateWithMsgNoWait('Failed to re-find timeline position');
      }
    } else {
      if (timelineType !== TwitterTimelineTypes.empty) {
        await lib.scrollIntoViewWithDelay(currentViewedTweetContainer);
      }
      yield defaultMessage[timelineType](currentViewedTweetContainer);
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
