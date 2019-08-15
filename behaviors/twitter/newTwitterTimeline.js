import * as lib from '../../lib';
import * as selectors from './selectors';
import * as shared from './shared';

/*
--- Timeline Junk / Separators ---
div > div.class > div.class

div > div.class

--- Tweet ---
div > div.class > div.class
 article[aria-haspopup, role="article"].class {tweet body}
  div[data-testid="tweet"].class
    div.class {profile image}
    div.class
      div.class {tweet content container}
        div.class {who tweeted and tweet time}
        div[lang].class {tweets text content container}
        ~~~ Tweet Content ~~~
     div[aria-label, role="group"].class {reply, retweet, like, share container}
       div.class > div[aria-label=<num replies>, role="button"]
       div.class > div[aria-label=<num retweets>, role="button"]
       div.class > div[aria-label=<num likes>, role="button"]
       div.class > div[aria-label=<share tweet>, role="button"]
 a[aria-haspopup, role="link"].class {show thread}

--- Tweet Content ---
%%%%% Image %%%%%
div.class >  div.class > div.class > div.class
  a[href="/user/status/photo/n"] > div.class > div.class
    div.class.style
    div.class > div[aria-label="Image"].class
      div.class.style[bg-image=url(...)]
      img[alt="Image", draggable="false].class

%%%%% Quoted Tweet %%%%%
div.class > div.class
  div[dir="auto"].class > span<Quote Tweet>
  div[aria-haspopup, role="blockquote"].class
    {quoted tweet}

%%%%% Link Card %%%%%
div.class >  div.class > div.class > div[aria-hidden="true"].class
  a[href="link to thing card about", rel=...]
   ...

%%%%% Video %%%%%
div.class >  div.class > div.class > div.class > div.class
  div.class
  div.class >  div.class > div.class > div.class > div[role="button"].class
    div.class > div.class > div.class
      video
  div
    div.class > span.style > div {time and number of views container}
      div.class {time}
      div.class {views}
    div.class

--- Promoted Tweet ---
div > div.class
 div.class
  h2[role="heading"] > div.class
    span {heading text}
 div.class > div.class
  ~~~ {tweet body} ~~~

--- Who to follow heading ---
div > div.class > div.class
 h2[role="heading"] > div.class
   span {heading text}

--- Who to follow suggestion ---
div > div.class
  div[role="button", data-testid="UserCell"].class > div.class
    div.class > div.class {profile image}
    div.class {profile details container}
      div.class
        div.class {profile name container}
        div.class {follow button container}
      div[dir="auto"].class {profile description}

--- Who to follow show more ---
div > div.class
  a[aria-haspopup, href="/i/relate_users/..."]

--- Timeline of specific user ---
header[role="banner"].class
main[role="main"].class > div.class
  div.class {empty}
  div.class
    div[data-testid="primaryColumn"].class > div.class > div.class
      div.class {user name, num tweets, follow/following button container}
        div.class > div.class > div.class > div.class > div.class
          div.class {back to previous timeline}
          div.class > div.class
            h2[role="heading"].class {user name}
            div[dir="auto"].class {num tweets}
          div.class {follow/following button container}
      div.class > div.class > div.class
        div.class {user info container}
        nav[aria-label="Profile timelines", role="navigation"].class {tweets, tweets with replies, media, likes} container
        div.class > section[aria-labelledby="accessible-list-n", role="region"].class {timeline}
          h1[dir="auto", role="heading", id="accessible-list-n"].class {users tweets heading}
          div[aria-label="Timeline: {users tweets heading}"].class {timeline start}
            div.style > div.style {timeline root}
              ~~~ Tweet ~~~
              ~~~ Timeline Junk / Separators ~~~
              ~~~ Promoted Tweet ~~~
              ~~~ Who to follow heading ~~~
              ~~~ Who to follow suggestion ~~~
              ~~~ Who to follow show more ~~~
              ....
    div[data-testid="sidebarColumn"].class

--- Own Timeline ---
header[role="banner"].class
main[role="main"].class > div.class
  div.class {empty}
  div.class
    div[data-testid="primaryColumn"].class > div.class > div.class
      div.class {home heading container}
      div.class {tweet something yourself}
      div.class {empty}
      div.class > div.class > div.class > section[aria-labelledby="accessible-list-n", role="region"].class {timeline}
        h1[dir="auto", role="heading", id="accessible-list-n"].class {your home timeline}
        div[aria-label="Timeline: {your home timeline}"].class
          div.style > div.style {timeline root}
            ~~~ Tweet ~~~
            ~~~ Timeline Junk / Separators ~~~
            ~~~ Promoted Tweet ~~~
            ~~~ Who to follow heading ~~~
            ~~~ Who to follow suggestion ~~~
            ~~~ Who to follow show more ~~~
            ....
    div[data-testid="sidebarColumn"].class
 */

const StatusExtractorRE = /(\/[^/]+\/status\/.+)/;

const reactInstanceGetter = lib.makeReactInstanceFromDOMElemFun();

/**
 * @param {?SomeElement} elem
 * @return {string|null}
 */
function extractTimelineReactComponentKey(elem) {
  const instance = reactInstanceGetter(elem);
  if (instance && instance.return) {
    return instance.return.key;
  }
  return null;
}

const TwitterTimelineTypes = {
  skipped: Symbol('skipped'),
  unavailable: Symbol('unavailable-tweet'),
  promotedTweet: Symbol('promoted-tweet'),
  whoToFollowHeading: Symbol('who-to-follow-heading'),
  whoToFollow: Symbol('who-to-follow'),
  whoToFollowShowMore: Symbol('who-to-follow-show-more'),
  unknown: Symbol('unknown-timeline-item'),
  header: Symbol('header-timeline-item'),
  footer: Symbol('footer-timeline-item'),
  showMore: Symbol('show-more-timeline-item'),
  tweet: Symbol('tweet'),
};

const WalkEndedReasons = {
  failedToFindFirstParent: 1,
  failedToFindFirstChild: 2,
  failedToRefindParent: 3,
  failedToRefindChild: 4,
  noMoreChildren: 0,
};

function initInfo() {
  const timelineStart = lib.qs(selectors.TimelineStart);
  const whoesTweets = lib.elemInnerText(
    lib.firstChildElemOfParent(timelineStart),
    true
  );
  const betterTimelineStartSelector = timelineStart
    ? `div[aria-label="${lib.attr(timelineStart, 'aria-label')}"]`
    : selectors.TimelineStart;
  const info = {
    ownTL: true,
    numTweets: 'Unknown number of tweets',
    whom: 'Your',
    whoesTweets,
    tlStartSelector: betterTimelineStartSelector,
  };
  if (!whoesTweets.includes('Your')) {
    info.ownTL = false;
    const primaryColumn = lib.qs(selectors.PrimaryColumn);
    const whoElem = lib.qs(
      selectors.ViewingWhatHeader,
      primaryColumn // lib.getElemsParentsSibling(lib.qs(selectors.BackToPreviousTimelinePart))
    );
    info.whom = lib.elemInnerText(whoElem, true);
    // h2 > whoesTlDiv;
    // div > text([0-9]+ Tweets)
    const howManyTweets = lib.elemInnerText(lib.getElemSibling(whoElem), true);
    info.numTweets =
      (howManyTweets && howManyTweets.split(' ')[0]) ||
      'Unknown number of tweets';
  }
  return info;
}

/**
 * Attempts to determine the timeline type from the supplied component key
 * if the component key is for a tweet then an additional check is done
 * in order to determine if the tweet is unavailable.
 * @param {?string} componentKey
 * @param {?SomeElement} tweetContainer
 * @return {?symbol}
 */
function timelineTypeFromComponentKey(componentKey, tweetContainer) {
  if (componentKey.startsWith('tweet')) {
    if (isUnavailableTweet(tweetContainer)) {
      return TwitterTimelineTypes.unavailable;
    }
    return TwitterTimelineTypes.tweet;
  }
  if (componentKey.startsWith('whoToFollow')) {
    return TwitterTimelineTypes.whoToFollow;
  }
  if (componentKey.startsWith('promotedTweet')) {
    return TwitterTimelineTypes.promotedTweet;
  }
  if (
    componentKey.startsWith('cursor-showMoreThreads') ||
    componentKey.endsWith('show_more_cursor')
  ) {
    return TwitterTimelineTypes.showMore;
  }
  if (
    componentKey.startsWith('header') ||
    componentKey.startsWith('footer') ||
    componentKey.startsWith('$divider') ||
    componentKey.startsWith('label') ||
    componentKey.startsWith('impressionPlaceholder')
  ) {
    return TwitterTimelineTypes.skipped;
  }
}

/**
 * @param {?SomeElement} tweetContainer
 * @return {symbol}
 */
function timelineItemTypeFromElement(tweetContainer) {
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
  const maybeHeading = lib.qs(selectors.TweetHeading, tweetContainer);
  if (maybeHeading) {
    if (
      lib.elemInnerTextEqsInsensitive(
        maybeHeading,
        selectors.PromotedTweetHeaderText,
        true
      )
    ) {
      return TwitterTimelineTypes.promotedTweet;
    }
    if (
      lib.elemInnerTextEqsInsensitive(
        maybeHeading,
        selectors.WhoToFollowHeaderText,
        true
      )
    ) {
      return TwitterTimelineTypes.whoToFollowHeading;
    }
  } else if (
    // check for promoted tweet in own timeline
    lib.xpathNumberQuery(selectors.PromotedTweetTextXpath, tweetContainer) === 1
  ) {
    return TwitterTimelineTypes.promotedTweet;
  }
  const secondChild = tweetContainer.firstElementChild.firstElementChild;
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
  // quick check for third child being an article and thus a tweet
  if (
    lib.selectorExists(
      selectors.TestIdTweetDiv,
      lib.qs('article', tweetContainer)
    )
  ) {
    return TwitterTimelineTypes.tweet;
  }
  return TwitterTimelineTypes.unknown;
}

function viewedTweetTweetedOnDate(tweetBody) {
  let tweetTextSibling = lib.selectedNextElementSibling(
    'div[lang][dir="auto"]',
    tweetBody
  );
  if (
    lib.elemMatchesSelector(
      lib.firstChildElementOf(tweetTextSibling),
      'div[dir="auto"]'
    )
  ) {
    return lib.elemInnerText(
      lib.chainFistChildElemOf(tweetTextSibling, 2),
      true
    );
  }
  // there is an embed need to move to next sibling
  tweetTextSibling = lib.getElemSibling(tweetTextSibling);
  if (
    lib.elemMatchesSelector(
      lib.firstChildElementOf(tweetTextSibling),
      'div[dir="auto"]'
    )
  ) {
    return lib.elemInnerText(
      lib.chainFistChildElemOf(tweetTextSibling, 2),
      true
    );
  }
  return 'unknown date';
}

/**
 * Set the date time and byInfo propreties of the supplied timeline info object
 * if subtl is falsy then the refindTweet property is set
 * @param {Object} tinfo
 * @param {boolean} [subTl]
 */
function setTweetByInfoAndMaybeRefindTweet(tinfo, subTl) {
  const tweetTime = lib.qs('time', tinfo.body);
  const tweetLinkElem = tweetTime && tweetTime.parentElement;
  if (tweetTime) {
    tinfo.dateTime = tweetTime.dateTime;
    tinfo.dateTimeHuman = tweetLinkElem.getAttribute('title');
  }
  let tweetedBy;
  let tweetedOn;
  if (!subTl) {
    tweetedBy =
      lib.elemInnerText(lib.nthPreviousSibling(tweetLinkElem, 2), true) ||
      'a twitter user';
    tweetedOn = tinfo.dateTimeHuman;
    const tweetSelector = `time[datetime="${tweetTime.dateTime}"]`;
    const tweetHref = lib.attr(tweetLinkElem, 'href');
    tinfo.refindTweet = someTweet => {
      const maybeSomeTweetsTime = lib.qs(tweetSelector, someTweet);
      if (!maybeSomeTweetsTime) return false;
      return lib.attrEq(maybeSomeTweetsTime.parentElement, 'href', tweetHref);
    };
  } else if (tweetTime && tweetLinkElem) {
    // viewing a conversation/thread tweet associated with a main tweet
    tweetedBy =
      lib.elemInnerText(lib.nthPreviousSibling(tweetLinkElem, 2), true) ||
      'a twitter user';
    tweetedOn = tinfo.dateTimeHuman;
  } else {
    // viewing the main tweet from primary or some sub timeline
    // i.e. we came from the primary or some sub timeline and are viewing
    // a conversation/thread timeline for some tweet
    tweetedBy =
      lib.innerTextOfSelected(
        'a',
        lib.lastChildElementOfSelector(selectors.TestIdTweetDiv, tinfo.body)
      ) || 'a twitter user';
    tweetedOn = viewedTweetTweetedOnDate(tinfo.body);
  }
  tinfo.byInfo = `${tweetedBy.trim().replace('\n', ' -- ')} on ${tweetedOn}`;
}
function isUnavailableTweet(tweetContainer) {
  return (
    lib.xpathNumberQuery(selectors.TweetIsUnavailableXpath, tweetContainer) ===
    1
  );
}

function extractTimelineItemInfo(tweetContainer, subTl) {
  const tinfo = {
    type: TwitterTimelineTypes.empty,
    byInfo: null,
    componentKey: null,
    refindTweet: null,
    dateTime: null,
    dateTimeHuman: null,
    body: null,
    quotedTweet: null,
    tweetImg: null,
  };
  if (!tweetContainer) return tinfo;
  // attempt to determine the timeline type using the component key
  tinfo.componentKey = extractTimelineReactComponentKey(tweetContainer);
  if (tinfo.componentKey) {
    tinfo.type = timelineTypeFromComponentKey(
      tinfo.componentKey,
      tweetContainer
    );
  }
  // if we failed to determine the timeline type from the component key
  // fallback to examining the rendered markup
  if (!tinfo.type) tinfo.type = timelineItemTypeFromElement(tweetContainer);
  if (tinfo.type === TwitterTimelineTypes.tweet) {
    tinfo.body = lib.qs('article', tweetContainer);
    setTweetByInfoAndMaybeRefindTweet(tinfo, subTl);
    if (!subTl) {
      // we view quoted tweets in the primary timeline
      tinfo.quotedTweet = lib.qs('div[role="blockquote"]', tinfo.body);
    } else {
      // we view tweets image in the secondary timeline
      tinfo.tweetImg = findTweetImage(tinfo.body);
    }
  }
  return tinfo;
}

function findTweetImage(container) {
  const imgLink = lib.qs(selectors.ViewTweetImageAnchor, container);
  if (imgLink == null) return imgLink;
  // sanity check: explicitly labeled as an image
  if (lib.selectorExists('div[aria-label="image" i]', imgLink)) return imgLink;
  // sanity check: if there is an alt on the image and the last check failed
  // then the images direct parent has its aria-label set to the images alt
  const img = lib.qs('img[alt]', imgLink);
  if (img && lib.attrEq(img.parentElement, 'aria-label', img.alt)) {
    return imgLink;
  }
  return null;
}

function subTimelineRoot() {
  const timelineStart = lib.qs(selectors.SubTimelineConversationStart);
  return lib.chainFistChildElemOf(timelineStart, 2);
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

async function subTimelineBack() {
  const curLoc = lib.browserLocation();
  const backDivButton = lib.qs(selectors.BackToPreviousTimelinePart);
  if (backDivButton) {
    const results = await lib.clickAndWaitForHistoryChange(backDivButton);
    if (results.ok) {
      return waitUntilSubTimelineLoaded(true);
    }
  }
  history.go(-1);
  await lib.waitForHistoryManipToChangeLocation(curLoc);
  await waitUntilSubTimelineLoaded(true);
}

async function gobackTo(toURL) {
  while (window.location.href !== toURL) {
    await subTimelineBack();
  }
}

const Reporter = {
  state: {
    total: 0,
    viewedFully: 0,
    videos: 0,
    threadsOrReplies: 0,
  },
  viewingMsg(tinfo) {
    return lib.stateWithMsgNoWait(
      `Viewing tweet by ${tinfo.byInfo}`,
      this.state
    );
  },
  msgWithState(msg) {
    return lib.stateWithMsgNoWait(msg, this.state);
  },
  viewedMsg(msg) {
    this.state.viewedFully += 1;
    return lib.stateWithMsgNoWait(msg, this.state);
  },
  quotedTweet(viewed) {
    const msg = `View${viewed ? 'ed' : 'ing'} quoted tweet`;
    return lib.stateWithMsgNoWait(msg, this.state);
  },
  handledNonTweet(tlinfo, tweetContainer) {
    switch (tlinfo.type) {
      case TwitterTimelineTypes.unavailable:
        return Reporter.msgWithState('Encountered tweet that is unavailable');
      case TwitterTimelineTypes.skipped:
        return lib.stateWithMsgNoWait('Encountered twitter junk', this.state);
      case TwitterTimelineTypes.promotedTweet:
        return lib.stateWithMsgNoWait(
          'Encountered a promoted tweet',
          this.state
        );
      case TwitterTimelineTypes.whoToFollowHeading:
        return lib.stateWithMsgNoWait(
          'Encountered start of twitters suggestion on who to follow',
          this.state
        );
      case TwitterTimelineTypes.whoToFollow:
        const who = lib.innerTextOfSelected('span', tweetContainer);
        return lib.stateWithMsgNoWait(
          `Encountered twitter's suggestion to follow - ${who ||
            'someone on twitter'}`,
          this.state
        );
      case TwitterTimelineTypes.whoToFollowShowMore:
        return lib.stateWithMsgNoWait(
          'Encountered the show more more people to follow on twitter button',
          this.state
        );
      default:
        return lib.stateWithMsgNoWait(
          'Encountered an unknown twitter timeline element',
          this.state
        );
    }
  },
};

async function waitForTwitterProgressBarToGoAway(selectFrom) {
  const progressBar = lib.qs(selectors.ProgressBar, selectFrom);
  if (progressBar) {
    await lib.waitUntilElementIsRemovedFromDom(progressBar);
    return true;
  }
  return false;
}

async function waitUntilSubTimelineLoaded(noDefaultDelay) {
  const wasProgressBar = await waitForTwitterProgressBarToGoAway();
  if (wasProgressBar && noDefaultDelay) return;
  await lib.delay(1500);
}

const MoreRepliesRe = /more\srepl(y|ies)/i;

async function* waitForImageLoaded(imageModal) {
  yield lib.stateWithMsgNoWait(
    'Waiting for tweet image(s) to load',
    Reporter.state
  );
  const delayTime = 1500;
  let times = 1;
  await lib.delay(delayTime);
  let imageProgress = lib.qs(selectors.ImageProgressBar, imageModal);
  while (imageProgress != null) {
    if (
      !imageProgress ||
      !imageProgress.isConnected ||
      !imageModal.isConnected
    ) {
      break;
    }
    yield lib.stateWithMsgNoWait(
      `Tweet image(s) still not loaded after ${(delayTime * ++times) /
        1000} seconds`,
      Reporter.state
    );
    await lib.delay(delayTime);
    imageProgress = lib.qs(selectors.ImageProgressBar, imageModal);
  }
  yield lib.stateWithMsgNoWait('Tweets image(s) have loaded', Reporter.state);
}

function getElemToClickForShowMoreTweet(tlPart) {
  const viewMoreReplies = lib.qs(
    'div[aria-haspopup="false"][role="button"]',
    tlPart
  );
  if (
    viewMoreReplies &&
    lib.elemInnerTextMatchesRegex(viewMoreReplies, MoreRepliesRe)
  ) {
    return viewMoreReplies;
  } else if (
    lib.xpathNumberQuery(selectors.ShowMoreOffensiveReplies, tlPart) &&
    lib.selectorExists('div[role="button"]', tlPart)
  ) {
    return lib.qs('div[role="button"]', tlPart);
  }
  return null;
}

async function* viewMainTimelineTweet(tweetInfo, tlLocation) {
  // attempt to catch the progress spinner to know when the sub timeline has loaded
  // also attempt to get the root on a good network day
  let currentSubTlRoot = subTimelineRoot();
  await waitForTwitterProgressBarToGoAway(
    lib.qs(selectors.SubTimelineConversationStart),
    currentSubTlRoot
  );
  // if we did not catch the sub timeline root we need it now
  if (!currentSubTlRoot) currentSubTlRoot = subTimelineRoot();
  if (!currentSubTlRoot) {
    await gobackTo(tlLocation);
    yield Reporter.msgWithState(`Failed to view tweet by ${tweetInfo.byInfo}`);
    return;
  }
  let currentSubTlPart = currentSubTlRoot.firstElementChild;
  while (currentSubTlPart != null) {
    const subTimelineInfo = extractTimelineItemInfo(currentSubTlPart, true);
    if (
      subTimelineInfo.type === TwitterTimelineTypes.tweet &&
      subTimelineInfo.body
    ) {
      await lib.scrollIntoViewWithDelay(subTimelineInfo.body);
      const convoPos = findCovoPartChildNum(currentSubTlRoot, currentSubTlPart);
      yield Reporter.msgWithState(`Viewing tweet by ${subTimelineInfo.byInfo}`);
      if (subTimelineInfo.tweetImg) {
        const imageViewingResults = await lib.clickAndWaitForHistoryChange(
          subTimelineInfo.tweetImg
        );
        if (imageViewingResults.clicked) {
          if (imageViewingResults.historyChanged) {
            yield Reporter.msgWithState(
              `Viewing tweet image - ${subTimelineInfo.byInfo}`
            );
            // we may or may not have multiple images
            // so lets just assume we do as only the image next
            // button differs
            const imageModal = lib.qs(selectors.ImageModalRoot);
            let imageNext = null;
            do {
              if (lib.selectorExists(selectors.ImageProgressBar, imageModal)) {
                yield* waitForImageLoaded(imageModal);
              }
              // if we have more images to be viewed imageNext will not be null
              // we have viewed all images
              imageNext = lib.qs(selectors.NextImage, imageModal);
              if (imageNext != null) {
                yield Reporter.msgWithState(
                  `Viewing next tweet image - ${subTimelineInfo.byInfo}`
                );
                await lib.clickAndWaitForHistoryChange(imageNext);
              }
            } while (imageNext != null);
            const closeDiv = lib.qs(selectors.ImagePopupCloser);
            const closeResults = await lib.clickAndWaitForHistoryChange(
              closeDiv
            );
            if (closeResults.clicked) {
              if (closeResults.historyChanged) {
                yield Reporter.msgWithState(`Viewed an tweets image`);
              }
            } else if (tlLocation !== lib.browserLocation()) {
              await subTimelineBack();
            }
          }
        }
        currentSubTlRoot = subTimelineRoot();
        currentSubTlPart = refindConvoPositionByIdx(currentSubTlRoot, convoPos);
      }
    } else if (subTimelineInfo.type === TwitterTimelineTypes.unavailable) {
      yield Reporter.msgWithState('Encountered tweet that is unavailable');
    } else if (
      subTimelineInfo.type === TwitterTimelineTypes.showMore ||
      !subTimelineInfo.componentKey
    ) {
      const clickToShowMore = getElemToClickForShowMoreTweet(currentSubTlPart);
      if (clickToShowMore) {
        yield Reporter.msgWithState('Loading more tweets');
        // the more replies "button" is replaced with the reply in-place
        // for swapping it with the current timeline item
        // due to this we need to hold onto the previous timeline item
        const lastTLItem = currentSubTlPart.previousElementSibling;
        lib.click(clickToShowMore);
        await waitForTwitterProgressBarToGoAway(currentSubTlRoot);
        if (!currentSubTlPart.isConnected && lastTLItem.isConnected) {
          currentSubTlPart = lastTLItem;
        }
      }
    }
    if (lostInternetConnection()) {
      yield* lostInternetTryAgain();
    }
    if (currentSubTlPart) {
      currentSubTlPart = currentSubTlPart.nextElementSibling;
    }
  }
  await gobackTo(tlLocation);
  yield Reporter.viewedMsg(`Viewed tweet by ${tweetInfo.byInfo}`);
}

function lostInternetConnection() {
  return lib.xpathSnapShot(selectors.LostConnectionXpath).snapshotLength > 0;
}

async function* lostInternetTryAgain() {
  let lostConnection = lib.xpathSnapShot(selectors.LostConnectionXpath);
  while (lostConnection.snapshotLength > 0) {
    yield Reporter.msgWithState(
      'Internet connection lost, attempting to get twitter to retry'
    );
    const parent = lostConnection.snapshotItem(0).parentElement;
    if (parent && parent.nextElementSibling) {
      await lib.clickWithDelay(parent.nextElementSibling);
      lostConnection = lib.xpathSnapShot(selectors.LostConnectionXpath);
      if (lostConnection.snapshotLength === 0) break;
      await lib.delay(5000);
    } else {
      yield Reporter.msgWithState(
        'Twitter has changed how they inform users about internet connection loss'
      );
      return;
    }
    lostConnection = lib.xpathSnapShot(selectors.LostConnectionXpath);
  }
  yield Reporter.msgWithState(`Internet connection, restored`);
}

export default async function* newTwitterTimeline(cliApi) {
  await lib.domCompletePromise();
  const info = initInfo();
  Reporter.state.total = info.numTweets;
  const walkState = {
    walkEndedReason: null,
    refindTimelinePositionPredicate: null,
  };
  const findMainTimelineRoot = () => {
    const tlstart = lib.qs(info.tlStartSelector);
    return tlstart.firstElementChild.firstElementChild;
  };
  const refindCurrentTLItem = currentTimelineRoot => {
    if (walkState.refindTimelinePositionPredicate == null) return null;
    return lib.findDirectChildElement(
      currentTimelineRoot,
      walkState.refindTimelinePositionPredicate
    );
  };
  let currentTLRoot = findMainTimelineRoot();
  // if we are still loading lets wait for twitter to do its thing
  if (
    currentTLRoot &&
    lib.selectorExists(selectors.ProgressBar, currentTLRoot)
  ) {
    await lib.waitUntilElementIsRemovedFromDom(
      lib.qs(selectors.ProgressBar, currentTLRoot)
    );
  }
  let currentTLItem = currentTLRoot.firstElementChild;
  while (currentTLItem != null) {
    let timelineInfo = extractTimelineItemInfo(currentTLItem);
    if (timelineInfo.type === TwitterTimelineTypes.tweet) {
      if (timelineInfo.body) {
        await lib.scrollIntoViewWithDelay(timelineInfo.body);
        yield Reporter.msgWithState(
          `Preparing to view tweet by ${timelineInfo.byInfo}`
        );
        walkState.refindTimelinePositionPredicate = timelineInfo.refindTweet;
        const tlLocation = lib.browserLocation();
        if (timelineInfo.quotedTweet) {
          yield Reporter.quotedTweet(false);
          const viewingQuotedTweetResult = await lib.clickAndWaitForHistoryChange(
            timelineInfo.quotedTweet
          );
          if (viewingQuotedTweetResult.ok) {
            await waitUntilSubTimelineLoaded(subTimelineRoot());
            yield Reporter.quotedTweet(true);
            await subTimelineBack();
            currentTLRoot = findMainTimelineRoot();
            if (!currentTLRoot) {
              walkState.walkEndedReason = WalkEndedReasons.failedToRefindParent;
              break;
            }
            currentTLItem = refindCurrentTLItem(currentTLRoot);
            if (!currentTLItem) {
              walkState.walkEndedReason = WalkEndedReasons.failedToRefindChild;
              break;
            }
            timelineInfo = extractTimelineItemInfo(currentTLItem);
          } else {
            yield Reporter.msgWithState('Failed to viewing quoted tweet');
          }
        }
        const viewingTweetResult = await lib.clickAndWaitForHistoryChange(
          timelineInfo.body
        );
        if (viewingTweetResult.ok) {
          yield* viewMainTimelineTweet(timelineInfo, tlLocation);
        } else if (!lib.locationEquals(tlLocation)) {
          yield Reporter.viewedMsg(
            `Failed to view tweet by ${timelineInfo.byInfo}`
          );
        }
      } else {
        yield Reporter.viewedMsg(
          `Failed to setup for viewing tweet by ${timelineInfo.byInfo}`
        );
      }
    } else {
      await lib.scrollIntoViewWithDelay(currentTLItem);
      if (timelineInfo.type !== TwitterTimelineTypes.skipped) {
        yield Reporter.handledNonTweet(timelineInfo, currentTLItem);
      }
    }
    if (lostInternetConnection()) {
      yield* lostInternetTryAgain();
    }
    if (!currentTLRoot.isConnected) {
      currentTLRoot = findMainTimelineRoot();
      if (!currentTLRoot) {
        walkState.walkEndedReason = WalkEndedReasons.failedToRefindParent;
        break;
      }
      currentTLItem = refindCurrentTLItem(currentTLRoot);
      if (!currentTLItem) {
        walkState.walkEndedReason = WalkEndedReasons.failedToRefindChild;
        break;
      }
    }
    if (currentTLItem.nextElementSibling == null) {
      const previousChildCount = currentTLRoot.childElementCount;
      const progressBar = lib.qs(selectors.ProgressBar, currentTLRoot);
      if (progressBar) {
        await lib.waitUntilElementIsRemovedFromDom(progressBar);
      }
      if (previousChildCount !== currentTLRoot.childElementCount) {
        await lib.waitForAdditionalElemChildren(currentTLRoot);
      }
    }
    currentTLItem = currentTLItem.nextElementSibling;
  }
  switch (walkState.walkEndedReason) {
    case WalkEndedReasons.failedToFindFirstParent:
    case WalkEndedReasons.failedToRefindParent:
      return Reporter.msgWithState('Failed to re-find timeline parent');
    case WalkEndedReasons.failedToFindFirstChild:
    case WalkEndedReasons.failedToRefindChild:
      return Reporter.msgWithState('Failed to re-find timeline position');
    case WalkEndedReasons.noMoreChildren:
      return Reporter.msgWithState('done');
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

// export const isBehavior = true;
