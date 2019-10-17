import * as lib from '../../lib';
import * as shared from './shared';
import * as selectors from './selectors';
import autoScrollBehavior from '../autoscroll';

function extractPostPopupElem(postPopup) {
  // get the next inner div.dialog because its next sibling is the close button
  // until instagram decides to change things
  const innerDivDialog = lib.qs(selectors.userDivDialog, postPopup);
  // maybe our friendo the close button
  const maybeCloseButton = lib.getElemSibling(innerDivDialog);
  const closeButton = lib.elementsNameEquals(maybeCloseButton, 'button')
    ? maybeCloseButton
    : null;
  // get a reference to the posts contents (div.dialog > article)
  const content = lib.qs(selectors.userPostTopMostContainer, innerDivDialog);
  return { innerDivDialog, closeButton, content };
}

async function openPost(maybeA) {
  await lib.clickWithDelay(maybeA);
  // wait for the post dialog to open and get a reference to that dom element
  return lib.waitForAndSelectElement(document, selectors.userDivDialog);
}

function closePost(closeButton, cliAPI) {
  // The load more comments button, depending on the number of comments,
  // will contain two variations of text (see xpathQ for those two variations).
  // getMoreComments handles getting that button for the two variations
  if (closeButton != null) {
    return lib.clickWithDelay(closeButton);
  }
  const found = lib.xpathOneOf({
    xpg: cliAPI.$x,
    queries: selectors.postPopupCloseXpath,
  });
  return lib.clickWithDelay(found.length ? found[0] : found.snapshotItem(0));
}

async function* handlePost(post, { cliAPI, info }) {
  // open the post (displayed in a separate part of the dom)
  // click the first child of the post div (a tag)
  lib.autoFetchFromDoc();
  let maybeA = lib.firstChildElementOf(post);
  if (!lib.objectInstanceOf(maybeA, window.HTMLAnchorElement)) {
    maybeA = lib.qs('a', maybeA);
  }
  if (!maybeA) {
    // we got nothing halp!!!
    lib.collectOutlinksFrom(post);
    return lib.stateWithMsgNoWait('Encountered a non-post', info.state);
  }
  const postId = shared.postId(maybeA);
  // wait for the post dialog to open and get a reference to that dom element
  const popupDialog = await openPost(maybeA);
  if (!popupDialog) {
    return lib.stateWithMsgNoWait(
      `Failed to open ${postId} for viewing`,
      info.state
    );
  }
  yield info.viewingPost(postId);
  lib.collectOutlinksFrom(popupDialog);
  const { content, closeButton } = extractPostPopupElem(popupDialog);
  let result;
  try {
    result = await shared.handlePostContent({
      thePost: post,
      viewing: shared.ViewingUser,
      content,
      info,
      postId,
    });
  } catch (e) {
    result = lib.stateWithMsgNoWait(
      `An error occurred while viewing the contents of the post (${postId})`,
      info.state
    );
  }
  yield result;
  const commentList = lib.qs('ul', content);
  if (commentList) {
    for await (const commentInfo of shared.viewComments({
      commentList,
      info,
      postId,
      $x: cliAPI.$x,
    })) {
      yield commentInfo;
    }
  }
  yield info.fullyViewedPost(postId);
  await closePost(closeButton, cliAPI);
}

function viewStoriesAndLoadPostView(cliAPI, info) {
  return async function* preTraversal() {
    if (shared.loggedIn(cliAPI.$x)) {
      // viewing stories change the markup of the page to be stories mode
      // not timeline mode and reverts back to timeline mode once done #react
      // thus we can only hold a reference to the element that will start
      // a story chain we will view now
      const profilePic = lib.qs('img[alt*="profile picture"]');
      if (
        profilePic &&
        window.getComputedStyle(profilePic).cursor === 'pointer'
      ) {
        yield* shared.viewStories(profilePic, info, true);
      }
      if (lib.selectorExists(selectors.userOpenStories)) {
        yield* shared.viewStories(lib.qs(selectors.userOpenStories), info);
      }
    }

    // load the 'single post view' assets by manipulating history
    // to load it for the first post, then going back to starting page
    yield lib.stateWithMsgNoWait('Loading single post view', info.state);

    const initialArticle = lib.qs('article');
    const firstPostA = lib.qs('a', initialArticle);
    const firstPostHref = firstPostA.href;
    const origLoc = window.location.href;

    // need to actually click on a post first in order to get
    // instagrams internals warmed up
    const popup = await openPost(firstPostA);
    const { closeButton } = extractPostPopupElem(popup);
    await lib.delay(lib.DelayAmount2Seconds);
    await closePost(closeButton, cliAPI);

    window.history.replaceState({}, '', firstPostHref);
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    let postArticle = null;

    await lib.waitForPredicate(() => {
      postArticle = lib.qs('article');
      return postArticle !== initialArticle;
    });

    window.history.replaceState({}, '', origLoc);
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));

    let initialAgainArticle = null;

    await lib.waitForPredicate(() => {
      initialAgainArticle = lib.qs('article');
      return initialAgainArticle !== postArticle;
    });

    yield lib.stateWithMsgNoWait('Done loading single post view', info.state);
  };
}

export default function instagramUserBehavior(cliAPI) {
  const info = shared.userLoadingInfo();
  return lib.traverseChildrenOfCustom({
    preTraversal: viewStoriesAndLoadPostView(cliAPI, info),
    additionalArgs: { cliAPI, info },
    async setup() {
      const parent = lib.chainFistChildElemOf(
        lib.qs(selectors.userPostTopMostContainer),
        2
      );
      if (parent) {
        await lib.scrollIntoViewWithDelay(parent.firstElementChild);
      }
      return parent;
    },
    async nextChild(parentElement, currentRow) {
      const nextRow = lib.getElemSibling(currentRow);
      if (nextRow) {
        await lib.scrollIntoViewWithDelay(nextRow);
      }
      return nextRow;
    },
    shouldWait(parentElement, currentRow) {
      if (currentRow.nextElementSibling != null) return false;
      if (info) return info.hasMorePosts();
      return true;
    },
    wait(parentElement, currentRow) {
      const previousChildCount = parentElement.childElementCount;
      return lib.waitForAdditionalElemChildrenMO(parentElement, {
        max: info.ok ? -1 : lib.secondsToDelayAmount(60),
        pollRate: lib.secondsToDelayAmount(2.5),
        guard() {
          const childTest =
            previousChildCount !== parentElement.childElementCount;
          if (!info.ok) return childTest;
          return !info.hasMorePosts() || childTest;
        },
      });
    },
    handler(row, additionalArgs) {
      return lib.traverseChildrenOf(row, handlePost, additionalArgs);
    },
    setupFailure() {
      // we got nothing at this point, HALP!!!
      lib.collectOutlinksFromDoc();
      lib.autoFetchFromDoc();
      return autoScrollBehavior();
    },
    postTraversal(failure) {
      const msg = failure
        ? 'Behavior finished due to failure to find users posts container, reverting to auto scroll'
        : 'Viewed all posts of the user being viewed';
      return lib.stateWithMsgNoWait(msg, info.state);
    },
  });
}

export const metadata = {
  name: 'instagramUserBehavior',
  displayName: 'Instagram User Page',
  match: {
    regex: /^https?:\/\/(www\.)?instagram\.com\/[^/]+(?:\/(?:[?].+)?(?:tagged(?:\/)?)?)?$/,
  },
  description:
    'Capture all stories, images, videos and comments on user’s page.',
  updated: '2019-10-11T17:08:12-04:00',
};

export const isBehavior = true;
