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

const TwitterTimelineTypes = {
  empty: Symbol('empty'),
  promotedTweet: Symbol('promoted-tweet'),
  whoToFollowHeading: Symbol('who-to-follow-heading'),
  whoToFollow: Symbol('who-to-follow'),
  whoToFollowShowMore: Symbol('who-to-follow-show-more'),
  unknown: Symbol('unknown-timeline-item'),
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
    numTweets: -1,
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
 * @param {?HTMLElement} tweetContainer
 * @return {symbol}
 */
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
  return TwitterTimelineTypes.unknown;
}

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

function getLikeReplyReTweetsNum(elem, selector) {
  const ariaLabelV = lib.attr(lib.qs(selector, elem), 'aria-label');
  if (ariaLabelV) {
    if (ariaLabelV.includes('.')) {
      const maybeNum = Number(ariaLabelV.split(' ')[0]);
      if (!isNaN(maybeNum)) return maybeNum;
    }
  }
  return 0;
}

function isPrimaryViewedTweetInSubTimeline(tweetOrContainer) {
  return lib.elemDataValueEqs(
    lib.elementsNameEquals(tweetOrContainer, 'article')
      ? tweetOrContainer
      : lib.qs('article', tweetOrContainer),
    'testid',
    'tweetDetail'
  );
}

function findTweetImage(container) {
  // explicitly labeled as an image
  let tweetImg = lib.qs('div[aria-label="image" i]', container);
  if (tweetImg) return tweetImg;
  // no clue what twitter might put in its tweets but if there is an alt on
  // the image and the last check failed the images direct parent
  // has its aria-label set to the images alt
  let img = lib.qs('img[alt]', container);
  if (img && lib.attrEq(img.parentElement, 'aria-label', img.alt)) {
    return img;
  }
  return null;
}

/**
 *
 * @param {Element} tweetContainer
 * @param {boolean} [subTl]
 * @return {{dateTime: null, quotedTweet: null, inThread: boolean, replies: number, dateTimeHuman: null, byInfo: string, retweets: number, body: ?Element, tweetImg: ?Element, primarySubTlTweet: boolean, likes: number, refindTweet: ?function(): boolean}}
 */
function extractTweetInfo(tweetContainer, subTl) {
  const tinfo = {
    primarySubTlTweet: false,
    inThread: false,
    replies: 0,
    likes: 0,
    retweets: 0,
    byInfo: 'a twitter user',
    refindTweet: null,
    dateTime: null,
    dateTimeHuman: null,
    body: null,
    quotedTweet: null,
    tweetImg: null,
  };
  tinfo.body = lib.qs('article', tweetContainer);
  if (!tinfo.body) return tinfo;
  const tweetTime = lib.qs('time', tinfo.body);
  let tweetLinkElem;
  if (tweetTime) {
    tweetLinkElem = tweetTime.parentElement;
    tinfo.dateTime = tweetTime.dateTime;
    tinfo.dateTimeHuman = tweetLinkElem.getAttribute('title');
  }

  if (subTl) {
    // look for indicator that we are viewing the primary tweet in a reply chain or thread
    if (isPrimaryViewedTweetInSubTimeline(tinfo.body)) {
      tinfo.primarySubTlTweet = true;
      tinfo.quotedTweet = lib.qs('div[role="blockquote"]', tinfo.body);
    }
  } else {
    // will we be viewing a thread
    tinfo.inThread = lib.elemInnerTextEqsInsensitive(
      tinfo.body.nextElementSibling,
      'show this thread',
      true
    );
    // create re-find tweet function for a tweet in the mani timeline viewed
    const tweetSelector = `time[datetime="${tweetTime.dateTime}"]`;
    const tweetHref = lib.attr(tweetLinkElem, 'href');
    tinfo.refindTweet = someTweet => {
      const maybeSomeTweetsTime = lib.qs(tweetSelector, someTweet);
      if (!maybeSomeTweetsTime) return false;
      return lib.attrEq(maybeSomeTweetsTime.parentElement, 'href', tweetHref);
    };
  }
  // view tweet images when viewing some tweet in the main or sub timeline
  tinfo.tweetImg = findTweetImage(tinfo.body);

  const isSubTlAndPrimarySub = subTl && tinfo.primarySubTlTweet;
  if (!subTl || !isSubTlAndPrimarySub) {
    tinfo.replies = getLikeReplyReTweetsNum(tinfo.body, selectors.RepliesElem);
    tinfo.likes = getLikeReplyReTweetsNum(tinfo.body, selectors.LikesElem);
    tinfo.retweets = getLikeReplyReTweetsNum(
      tinfo.body,
      selectors.RewteetsElem
    );
  }

  // tweet by information
  let maybeByElem;
  if (isSubTlAndPrimarySub) {
    maybeByElem = lib.qs('a', lib.chainNthChildElementOf(tinfo.body, 2, 2));
  } else if (tweetLinkElem) {
    maybeByElem = lib.nthPreviousSibling(tweetLinkElem, 2);
  }
  if (maybeByElem) {
    const tweetBy = lib.elemInnerText(maybeByElem, true);
    if (tweetBy) {
      const clean = tweetBy.replace('\n', ' -- ');
      tinfo.byInfo = `${clean !== 'null' ? clean : 'a twitter user'} on ${
        tinfo.dateTimeHuman
      }`;
    }
  } else {
    if (tinfo.dateTimeHuman) {
      tinfo.byInfo = `${tinfo.byInfo} on ${tinfo.dateTimeHuman}`;
    }
  }
  return tinfo;
}

function subTimelineRoot() {
  const timelineStart = lib.qs(selectors.SubTimelineConversationStart);
  return lib.chainFistChildElemOf(timelineStart, 2);
}

/**
 *
 * @return {?string}
 */
function subTimelineFor() {
  const timelineStart = lib.qs(selectors.SubTimelineConversationStart);
  return lib.elemInnerText(timelineStart.previousElementSibling);
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
    totalTweets: 0,
    viewed: 0,
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
    this.state.viewed += 1;
    return lib.stateWithMsgNoWait(msg, this.state);
  },
  handledNonTweet(tlType, tweetContainer) {
    switch (tlType) {
      case TwitterTimelineTypes.empty:
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
      case TwitterTimelineTypes.unknown:
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
  let times = 0;
  while (true) {
    const imageProgress = lib.qs(selectors.ImageProgressBar, imageModal);
    if (
      !imageProgress ||
      !imageProgress.isConnected ||
      !imageModal.isConnected
    ) {
      break;
    }
    await lib.delay(delayTime);
    yield lib.stateWithMsgNoWait(
      `Tweet image(s) still not loaded after ${(delayTime * ++times) / 1000} seconds`,
      Reporter.state
    );
  }
  yield lib.stateWithMsgNoWait('Tweets image(s) have loaded', Reporter.state);
}

async function* viewMainTimelineTweet(tweetInfo, tlLocation) {
  await waitUntilSubTimelineLoaded();
  let currentSubTlRoot = subTimelineRoot();
  if (!currentSubTlRoot) {
    await gobackTo(tlLocation);
    yield Reporter.msgWithState(`Failed to view tweet by ${tweetInfo.byInfo}`);
    return;
  }
  let currentSubTlPart = currentSubTlRoot.firstElementChild;
  // TODO(N0taN3rd): ensure we start from viewed tweet in a thread or convo
  // if (isPrimaryViewedTweetInSubTimeline(currentSubTlRoot.firstElementChild)) {
  //   currentSubTlPart = currentSubTlRoot.firstElementChild;
  // } else {
  //   currentSubTlPart =
  //     lib.findDirectChildElement(
  //       currentSubTlRoot,
  //       isPrimaryViewedTweetInSubTimeline
  //     ) || currentSubTlRoot.firstElementChild;
  // }
  let tInfo;
  while (currentSubTlPart != null) {
    tInfo = extractTweetInfo(currentSubTlPart, true);
    if (tInfo.body) {
      await lib.scrollIntoViewWithDelay(tInfo.body);
      const convoPos = findCovoPartChildNum(currentSubTlRoot, currentSubTlPart);
      if (convoPos === -1) {
        yield Reporter.msgWithState(`Failed to re-find sub-timeline position`);
        break;
      }
      if (!tInfo.primarySubTlTweet) {
        yield Reporter.msgWithState(`Viewing tweet by ${tInfo.byInfo}`);
      }
      if (tInfo.tweetImg) {
        const imageViewingResults = await lib.clickAndWaitForHistoryChange(
          tInfo.tweetImg
        );
        if (imageViewingResults.clicked) {
          if (imageViewingResults.historyChanged) {
            yield Reporter.msgWithState(
              `Viewing tweet image - ${tInfo.byInfo}`
            );
            const imageModal = lib.qs(selectors.ImageModalRoot);
            let imageNext = null;
            do {
              if (lib.selectorExists(selectors.ImageProgressBar, imageModal)) {
                yield* waitForImageLoaded(imageModal);
              }
              imageNext = lib.qs(selectors.NextImage, imageModal);
              if (imageNext != null) {
                yield Reporter.msgWithState(
                  `Viewing next tweet image - ${tInfo.byInfo}`
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
              console.log('booo', lib.browserLocation());
              await subTimelineBack();
            }
          }
        }
      }
      if (tInfo.primarySubTlTweet && tInfo.quotedTweet) {
        yield Reporter.msgWithState('Viewing quoted tweet');
        const viewQuotedResults = await lib.clickAndWaitForHistoryChange(
          tInfo.quotedTweet
        );
        await waitUntilSubTimelineLoaded();
        if (viewQuotedResults.clicked) {
          if (viewQuotedResults.historyChanged) {
            yield Reporter.msgWithState('Viewed quoted tweet');
            await subTimelineBack();
          }
        }
        currentSubTlRoot = subTimelineRoot();
        currentSubTlPart = refindConvoPositionByIdx(currentSubTlRoot, convoPos);
      }
    } else {
      const viewMoreReplies = lib.qs(
        'div[aria-haspopup="false"][role="button"]',
        currentSubTlPart
      );
      if (
        viewMoreReplies &&
        lib.elemInnerTextMatchesRegex(viewMoreReplies, MoreRepliesRe)
      ) {
        yield Reporter.msgWithState('Loading more replies');
        // the more replies "button" is replaced with the reply in-place
        // for swapping it with the current timeline item
        // due to this we need to hold onto the previous timeline item
        const lastTLItem = currentSubTlPart.previousElementSibling;
        lib.click(viewMoreReplies);
        await waitForTwitterProgressBarToGoAway(currentSubTlRoot);
        if (!currentSubTlPart.isConnected && lastTLItem.isConnected) {
          currentSubTlPart = lastTLItem;
        }
      }
    }
    if (currentSubTlPart) {
      currentSubTlPart = currentSubTlPart.nextElementSibling;
    }
  }
  await gobackTo(tlLocation);
  yield Reporter.viewedMsg(`Viewed tweet by ${tweetInfo.byInfo}`);
}

export default async function* newTwitterTimeline(cliApi) {
  await lib.domCompletePromise();
  const info = initInfo();
  Reporter.state.totalTweets = info.numTweets;
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
      const progressBar = lib.qs(selectors.ProgressBar, currentTimelineRoot);
      if (progressBar) {
        return lib.waitUntilElementIsRemovedFromDom(progressBar);
      }
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
      const mainTLTweetInfo = extractTweetInfo(tweetContainer);
      if (mainTLTweetInfo.body) {
        await lib.scrollIntoViewWithDelay(mainTLTweetInfo.body);
        yield Reporter.viewingMsg(mainTLTweetInfo);
        walkState.refindTimelinePositionPredicate = mainTLTweetInfo.refindTweet;
        const tlLocation = lib.browserLocation();
        const viewingTweetResult = await lib.clickAndWaitForHistoryChange(
          mainTLTweetInfo.body
        );
        if (viewingTweetResult.ok) {
          yield* viewMainTimelineTweet(mainTLTweetInfo, tlLocation);
        } else if (!lib.locationEquals(tlLocation)) {
          yield Reporter.viewedMsg(
            `Failed to view tweet by ${mainTLTweetInfo.byInfo}`
          );
        }
      } else {
        yield Reporter.viewedMsg(
          `Failed to setup for viewing tweet by ${mainTLTweetInfo.byInfo}`
        );
      }
    } else if (timelineType !== TwitterTimelineTypes.empty) {
      await lib.scrollIntoViewWithDelay(tweetContainer);
      yield Reporter.handledNonTweet(timelineType, tweetContainer);
    }
  }
  switch (walkState.walkEndedReason) {
    case WalkEndedReasons.failedToFindFirstParent:
    case WalkEndedReasons.failedToRefindParent:
      console.log('fail fish');
      return Reporter.msgWithState('Failed to re-find timeline parent');
    case WalkEndedReasons.failedToFindFirstChild:
    case WalkEndedReasons.failedToRefindChild:
      console.log('fail fish');
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
