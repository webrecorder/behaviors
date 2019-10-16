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
    tinfo.dateTimeHuman = lib.attr(tweetLinkElem, 'title');
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

/**
 * Returns the root, tweet loader, of a subtimeline
 * @return {?SomeElement}
 */
function subTimelineRoot() {
  // twitter now uses css transitions to show tweets loading
  // the element does the loading is the first child of the
  // element with aria-label "timeline: conversation"
  return lib.firstChildElementOfSelector(
    selectors.SubTimelineConversationStart
  );
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
    if (prevIdx !== -1 && prevIdx < convoRoot.children.length) {
      return convoRoot.children[prevIdx];
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
  if ((wasProgressBar && noDefaultDelay) || noDefaultDelay) return;
  await lib.delay(1500);
}

/**
 * This function waits for the the tweets of some subtimeline to be loaded
 * If twitter decides to show a progress bar, a wait for it to go away is done
 * If the root of the subtimelines tweets is not rendered yet, a wait for it
 * to be rendered is done.
 * If the root of the subtimelines tweet does not have any children yet,
 * a wait is made for those children to be shown
 * @param {SomeElement} selectFrom
 * @return {Promise<void>}
 */
async function waitUntilSubTimelineLoadedAndTweetDisplayed(selectFrom) {
  // attempt to catch the progress bar if it was shown at all
  await waitForTwitterProgressBarToGoAway(selectFrom);
  // we need to determine if the subtimeline root is displayed
  let tlRoot = subTimelineRoot();
  if (!tlRoot) {
    // it was not so we need to wait for it to be created
    await lib.waitForPredicate(() => subTimelineRoot() != null, { max: 10000 });
    tlRoot = subTimelineRoot();
  }
  // check for the no kids case and if there are none wait for them
  if (tlRoot && lib.numElemChildren(tlRoot) === 0) {
    await lib.waitForAdditionalElemChildren(tlRoot);
  }
}

const MoreRepliesRe = /more\srepl(y|ies)/i;

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

function isImageNextButtonDisabled(imageNext) {
  return (
    lib.elemMatchesSelector(imageNext, 'div[aria-disabled="true"]') ||
    imageNext.disabled
  );
}

async function* viewTweetImages(byInfo, tlLocation) {
  yield Reporter.msgWithState(`Viewing tweet image - ${byInfo}`);
  // we may or may not have multiple images
  // so lets just assume we do as only the image next
  // button differs
  const imageModal = lib.qs(selectors.ImageModalRoot);
  const delayTime = 1500;
  let imageNext = null;
  do {
    if (lib.selectorExists(selectors.ImageProgressBar, imageModal)) {
      yield lib.stateWithMsgNoWait(
        'Waiting for tweet image(s) to load',
        Reporter.state
      );
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
      yield lib.stateWithMsgNoWait(
        'Tweets image(s) have loaded',
        Reporter.state
      );
    }
    // if we have more images to be viewed imageNext will not be null
    // we have viewed all images
    imageNext = lib.qs(selectors.NextImage, imageModal);
    if (imageNext != null) {
      if (!isImageNextButtonDisabled(imageNext)) {
        yield Reporter.msgWithState(`Viewing next tweet image - ${byInfo}`);
        await lib.clickAndWaitForHistoryChange(imageNext);
      } else {
        break;
      }
    }
  } while (imageNext != null);
  const closeDiv = lib.qs(selectors.ImagePopupCloser);
  const closeResults = await lib.clickAndWaitForHistoryChange(closeDiv);
  if (closeResults.clicked) {
    if (closeResults.historyChanged) {
      yield Reporter.msgWithState(`Viewed an tweets image`);
    }
  } else if (tlLocation !== lib.browserLocation()) {
    await subTimelineBack();
  }
}

async function* viewMainTimelineTweet(tweetInfo, tlLocation) {
  // attempt to catch the progress spinner to know when the sub timeline has loaded
  // also attempt to get the root on a good network day
  await waitUntilSubTimelineLoadedAndTweetDisplayed(
    lib.qs(selectors.SubTimelineConversationStart)
  );
  if (subTimelineRoot() == null) {
    await gobackTo(tlLocation);
    yield Reporter.msgWithState(`Failed to view tweet by ${tweetInfo.byInfo}`);
    return;
  }
  let currentConvoPos = -1;
  const walker = new lib.DisconnectingWalk({
    findParent: subTimelineRoot,
    refindChild: (parent, child) =>
      refindConvoPositionByIdx(parent, currentConvoPos),
  });
  for await (const subTLPart of walker.walk()) {
    const subTimelineInfo = extractTimelineItemInfo(subTLPart, true);
    if (
      subTimelineInfo.type === TwitterTimelineTypes.tweet &&
      subTimelineInfo.body
    ) {
      lib.collectOutlinksFrom(subTLPart);
      await lib.scrollIntoViewWithDelay(subTimelineInfo.body);
      currentConvoPos = findCovoPartChildNum(walker.parent, subTLPart);
      yield Reporter.msgWithState(`Viewing tweet by ${subTimelineInfo.byInfo}`);
      if (subTimelineInfo.tweetImg) {
        const imageViewingResults = await lib.clickAndWaitForHistoryChange(
          subTimelineInfo.tweetImg
        );
        if (imageViewingResults.clicked) {
          if (imageViewingResults.historyChanged) {
            yield* viewTweetImages(subTimelineInfo.byInfo, tlLocation);
          }
        }
      }
    } else if (subTimelineInfo.type === TwitterTimelineTypes.unavailable) {
      yield Reporter.msgWithState('Encountered tweet that is unavailable');
    } else if (
      subTimelineInfo.type === TwitterTimelineTypes.showMore ||
      !subTimelineInfo.componentKey
    ) {
      const clickToShowMore = getElemToClickForShowMoreTweet(subTLPart);
      if (clickToShowMore) {
        yield Reporter.msgWithState('Loading more tweets');
        // the more replies "button" is replaced with the reply in-place
        // for swapping it with the current timeline item
        // due to this we need to hold onto the previous timeline item
        const lastTLItem = subTLPart.previousElementSibling;
        lib.click(clickToShowMore);
        await waitForTwitterProgressBarToGoAway(walker.parent);
        if (!subTLPart.isConnected && lastTLItem.isConnected) {
          walker.swapChild(lastTLItem);
        }
      }
    }
    if (lostInternetConnection()) {
      yield* lostInternetTryAgain();
    }
  }
  await gobackTo(tlLocation);
  yield Reporter.viewedMsg(
    `Viewed conversation or thread of tweets by ${tweetInfo.byInfo}`
  );
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
    // the xpath query selects the element that has the "lost internet" test
    // we need to click its parent elements next element sibling to get
    // twitter to try connecting again
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
  let childRefinder;
  const walker = new lib.DisconnectingWalk({
    loader: true,
    // twitter now uses css transitions to show tweets loading
    // the element does the loading is the first child of the
    // element with aria-label "Timeline: <user>’s Tweets"
    findParent: () => lib.firstChildElementOfSelector(info.tlStartSelector),
    refindChild: (parent, child) =>
      lib.findDirectChildElement(parent, childRefinder),
    async wait(parent, child) {
      const previousChildCount = parent.childElementCount;
      const progressBar = lib.qs(selectors.ProgressBar, parent);
      if (progressBar) {
        await lib.waitUntilElementIsRemovedFromDom(progressBar);
      }
      if (previousChildCount !== parent.childElementCount) {
        await lib.waitForAdditionalElemChildren(parent);
      }
    },
  });

  if (
    walker.parent &&
    lib.selectorExists(selectors.ProgressBar, walker.parent)
  ) {
    await lib.waitUntilElementIsRemovedFromDom(
      lib.qs(selectors.ProgressBar, walker.parent)
    );
  }

  for await (const timelineItem of walker.walk()) {
    lib.collectOutlinksFrom(timelineItem);
    let timelineInfo = extractTimelineItemInfo(timelineItem);
    if (timelineInfo.type === TwitterTimelineTypes.tweet) {
      if (timelineInfo.body) {
        await lib.scrollIntoViewWithDelay(timelineInfo.body);
        yield Reporter.msgWithState(
          `Preparing to view tweet by ${timelineInfo.byInfo}`
        );
        childRefinder = timelineInfo.refindTweet;
        const tlLocation = lib.browserLocation();
        if (timelineInfo.quotedTweet) {
          yield Reporter.quotedTweet(false);
          const viewingQuotedTweetResult = await lib.clickAndWaitForHistoryChange(
            timelineInfo.quotedTweet
          );
          if (viewingQuotedTweetResult.ok) {
            await waitUntilSubTimelineLoaded(true);
            yield Reporter.quotedTweet(true);
            await subTimelineBack();
            if (!walker.refind()) break;
            timelineInfo = extractTimelineItemInfo(walker.child);
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
      childRefinder = null;
      await lib.scrollIntoViewWithDelay(timelineItem);
      if (timelineInfo.type !== TwitterTimelineTypes.skipped) {
        yield Reporter.handledNonTweet(timelineInfo, timelineItem);
      }
    }
    if (lostInternetConnection()) {
      yield* lostInternetTryAgain();
    }
  }

  switch (walker.walkEndedReason) {
    case lib.WalkEndedReasons.failedToFindFirstParent:
      return Reporter.msgWithState('Failed to find timeline parent');
    case lib.WalkEndedReasons.failedToRefindParent:
      return Reporter.msgWithState('Failed to re-find timeline parent');
    case lib.WalkEndedReasons.failedToFindFirstChild:
      return Reporter.msgWithState('Failed to find a tweet');
    case lib.WalkEndedReasons.failedToRefindChild:
      return Reporter.msgWithState('Failed to re-find timeline position');
    case lib.WalkEndedReasons.noMoreChildren:
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
  updated: '2019-08-20T18:15:59-04:00',
};

// export const isBehavior = true;
