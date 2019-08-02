import * as lib from '../../lib';
import * as selectors from './selectors';
import * as shared from './shared';
import { id } from '../../lib';

const mainRoleMain = 'main[role="main"]';
const ProfileTimelineNav =
  'nav[aria-label="profile timelines" i][role="navigation"]';
const TimelineStart = 'div[aria-label*="Timeline: "]';
const TweetHeading = 'h2[role="heading"]';
const WhoToFollowHeaderText = 'who to follow';
const PromotedTweetHeaderText = 'promoted tweet';
const ShowThisThreadText = 'show this thread';
const H2ElemName = 'h2';
const TweetConvoThreadTimelineStart =
  'div[aria-label="timeline: conversation" i]';

const TwitterTimelineTypes = {
  empty: Symbol('empty'),
  promotedTweet: Symbol('promoted-tweet'),
  whoToFollowHeading: Symbol('who-to-follow-heading'),
  whoToFollow: Symbol('who-to-follow'),
  whoToFollowShowMore: Symbol('who-to-follow-show-more'),
  unknown: Symbol('unknown-timeline-item'),
  tweet: Symbol('tweet'),
};

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
    tlStartSelector: betterTimelineStartSelector,
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
      `Encountered twitter's suggestion to follow - ${lib.innerTextOfSelected(
        'span',
        tweetContainer
      ) || 'someone on twitter'}`
    ),
  [TwitterTimelineTypes.whoToFollowShowMore]: tweetContainer =>
    lib.stateWithMsgNoWait(
      'Encountered start of twitters link to show more people to follow on twitter'
    ),
  [TwitterTimelineTypes.unknown]: tweetContainer =>
    lib.stateWithMsgNoWait('Encountered an unknown twitter timeline element'),
};

const WalkEndedReasons = {
  failedToFindFirstParent: 1,
  failedToFindFirstChild: 2,
  failedToRefindParent: 3,
  failedToRefindChild: 4,
  noMoreChildren: 0,
};

async function* disconnectingWalk(walkState) {
  let parentElem = walkState.findParentElement();
  if (!parentElem) {
    walkState.walkEndedReason = WalkEndedReasons.failedToFindFirstParent;
    return;
  }
  let currentChild = walkState.nextChild(parentElem);
  if (!currentChild) {
    walkState.walkEndedReason = WalkEndedReasons.failedToFindFirstChild;
    return;
  }
  while (currentChild != null) {
    yield currentChild;
    if (!parentElem.isConnected) {
      parentElem = walkState.findParentElement();
      if (!parentElem) {
        walkState.walkEndedReason = WalkEndedReasons.failedToRefindParent;
        break;
      }
      currentChild = walkState.refindCurrentChild(parentElem, currentChild);
      if (!currentChild) {
        walkState.walkEndedReason = WalkEndedReasons.failedToRefindChild;
        break;
      }
    }
    if (walkState.shouldWait(parentElem, currentChild)) {
      await walkState.wait(parentElem, currentChild);
    }
    currentChild = walkState.nextChild(parentElem, currentChild);
  }
  walkState.walkEndedReason = WalkEndedReasons.noMoreChildren;
}

function makeRefindTimelinePostionPredicate(tweetContainer) {
  const tweetTime = lib.qs('time', tweetContainer);
  const tweetLinkElem = tweetTime.parentElement;
  tweetLinkElem._no_rewrite = true;
  const tweetSelector = `a[href="${tweetLinkElem.getAttribute('href')}"]`;
  return someTweet => lib.selectorExists(tweetSelector, someTweet);
}

var repliesElem = 'div[aria-label*="reply" i][role="button"]';
var likesElem = 'div[aria-label*="like" i][role="button"]';
var rewteetsElem = 'div[aria-label*="retweet" i][role="button"]';

function getLikeReplyReTweetsNum(elem, selector) {
  const ariaLabelV = lib.attr(lib.qs(selector, elem), 'aria-label');
  if (ariaLabelV) {
    return ariaLabelV.includes('.') ? Number(ariaLabelV.split(' ')[0]) : 0;
  }
  return -1;
}

function tweetInfo(tweetContainer) {
  const tinfo = {
    inThread: false,
    replies: -1,
    likes: -1,
    retweets: -1,
    refindTweet: null,
    dateTime: null,
    dateTimeHuman: null,
    by: 'A twitter user',
    body: null,
  };
  const tweetBodyArticle = lib.qs('article', tweetContainer);
  if (!tweetBodyArticle) return tinfo;
  tinfo.body = tweetBodyArticle;
  // the next element sibling of the tweet body is an a tag with text indicating
  // the current tweet is in a thread IFF it is in a thread
  tinfo.replies = getLikeReplyReTweetsNum(tweetBodyArticle, repliesElem);
  tinfo.likes = getLikeReplyReTweetsNum(tweetBodyArticle, likesElem);
  tinfo.retweets = getLikeReplyReTweetsNum(tweetBodyArticle, rewteetsElem);
  tinfo.inThread = lib.elemInnerTextEqsInsensitive(
    tweetBodyArticle.nextElementSibling,
    'show this thread',
    true
  );
  const tweetTime = lib.qs('time', tweetBodyArticle);
  tinfo.dateTime = tweetTime.dateTime;
  const tweetLinkElem = tweetTime.parentElement;
  if (
    tweetLinkElem.previousElementSibling &&
    tweetLinkElem.previousElementSibling.previousElementSibling
  ) {
    const by =
      tweetLinkElem.previousElementSibling.previousElementSibling.innerText;
    tinfo.by = by ? by.substring(by.indexOf('@')).trim() : 'A twitter user';
  }
  tinfo.dateTimeHuman = tweetLinkElem.getAttribute('title');
  tweetLinkElem._no_rewrite = true;
  const tweetSelector = `time[datetime="${tweetTime.dateTime}"]`;
  tinfo.refindTweet = someTweet => lib.selectorExists(tweetSelector, someTweet);
  return tinfo;
}

function getConvoRoot() {
  const tweetConvoStart = lib.qs(TweetConvoThreadTimelineStart);
  return lib.chainFistChildElemOf(tweetConvoStart, 2);
}

function findCovoPartChildNum(convoRoot, convoPart) {
  if (convoRoot && convoRoot.childElementCount > 0) {
    for (let i = 0; i < convoRoot.children.length; i++) {
      if (convoPart === convoRoot.children[i]) {
        return i;
      }
    }
  }
  return -1;
}

function refindConvoPositionByIdx(convoRoot, prevIdx) {
  if (convoRoot && convoRoot.childElementCount > 0) {
    for (let i = 0; i < convoRoot.children.length; i++) {
      if (prevIdx === i) {
        return convoRoot.children[i];
      }
    }
  }
  return null;
}

async function navigateHistoryBack() {
  const curLoc = window.location.href;
  history.back();
  await lib.waitForHistoryManipToChangeLocation(curLoc);
  await lib.delay(2000);
}

async function gobackTo(toURL) {
  while (window.location.href !== toURL) {
    await navigateHistoryBack();
  }
}

async function* viewMainTimelineTweet(tweetInfo, tlLocation) {
  await lib.delay(2000);
  const tweetContext = lib.innerTextOfSelected('h2', lib.qs('main'));
  console.log(tweetContext);
  yield lib.stateWithMsgNoWait(tweetContext);
  const decentState = { depth: 0 };
  let currentCovoRoot = getConvoRoot();
  if (!currentCovoRoot) {
  }
  let currentCovoPart = currentCovoRoot.firstElementChild;
  const tweetLoc = window.location.href;
  let convoTweetBody;
  while (currentCovoPart) {
    convoTweetBody = lib.qs('article', currentCovoPart);
    if (convoTweetBody) {
      await lib.scrollIntoViewWithDelay(convoTweetBody);
      const convoPos = findCovoPartChildNum(currentCovoRoot, currentCovoPart);
      if (convoPos === -1) break;
      yield lib.stateWithMsgNoWait('Viewing tweet in reply or thread');
      const covoBody = lib.qs('article', currentCovoPart);
      const quotedTweet = lib.qs('div[role="blockquote"]', covoBody);
      if (quotedTweet) {
        yield lib.stateWithMsgNoWait('Viewing quoted tweet');
        await Promise.all([
          lib.clickWithDelay(quotedTweet),
          lib.waitForHistoryManipToChangeLocation(tweetLoc),
        ]);
        await navigateHistoryBack();
        currentCovoRoot = getConvoRoot();
        currentCovoPart = refindConvoPositionByIdx(currentCovoRoot, convoPos);
      }
    }
    if (currentCovoPart) {
      currentCovoPart = currentCovoPart.nextElementSibling;
    }
  }
  await gobackTo(tlLocation);
}

export default async function* timelineIterator(cliApi) {
  const info = initInfo();
  const walkState = {
    walkEndedReason: null,
    refindTimelinePositionPredicate: null,
    findParentElement() {
      const tlstart = lib.qs(info.tlStartSelector);
      return tlstart.firstElementChild.firstElementChild;
    },
    refindCurrentChild(currentTimelineRoot, currentTimelineItem) {
      if (this.refindTimelinePositionPredicate == null) return null;
      return lib.findDirectChildElement(
        currentTimelineRoot,
        this.refindTimelinePositionPredicate
      );
    },
    nextChild(currentTimelineRoot, currentTimelineItem) {
      if (currentTimelineItem != null) {
        return currentTimelineItem.nextElementSibling;
      }
      return currentTimelineRoot.firstElementChild;
    },
    shouldWait(currentTimelineRoot, currentTimelineItem) {
      return currentTimelineItem.nextElementSibling == null;
    },
    wait(currentTimelineRoot, currentTimelineItem) {
      return lib.waitForAdditionalElemChildren(
        currentTimelineRoot,
        currentTimelineRoot.childElementCount
      );
    },
  };
  let timelineType;
  for await (const tweetContainer of disconnectingWalk(walkState)) {
    timelineType = determineTimelineItemType(tweetContainer);
    if (timelineType === TwitterTimelineTypes.tweet) {
      const tInfo = tweetInfo(tweetContainer);
      if (tInfo.body) {
        await lib.scrollIntoViewWithDelay(tInfo.body);
        yield lib.stateWithMsgNoWait(
          `Viewing tweet by ${tInfo.by} on ${tInfo.dateTimeHuman}`
        );
        walkState.refindTimelinePositionPredicate = tInfo.refindTweet;
        const tlLocation = window.location.href;
        if (lib.click(tInfo.body)) {
          if (await lib.waitForHistoryManipToChangeLocation(tlLocation)) {
            yield* viewMainTimelineTweet(tInfo, tlLocation);
          }
        }
      } else {
        yield lib.stateWithMsgNoWait('failed to ');
      }
    } else if (timelineType !== TwitterTimelineTypes.empty) {
      await lib.scrollIntoViewWithDelay(tweetContainer);
      yield defaultMessage[timelineType](tweetContainer);
    }
  }
  switch (walkState.walkEndedReason) {
    case WalkEndedReasons.failedToFindFirstParent:
    case WalkEndedReasons.failedToRefindParent:
      console.log('fail fish');
      return lib.stateWithMsgNoWait('Failed to re-find timeline parent');
    case WalkEndedReasons.failedToFindFirstChild:
    case WalkEndedReasons.failedToRefindChild:
      console.log('fail fish');
      return lib.stateWithMsgNoWait('Failed to re-find timeline position');
    case WalkEndedReasons.noMoreChildren:
      return lib.stateWithMsgNoWait('done');
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
