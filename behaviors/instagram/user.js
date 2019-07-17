import * as lib from '../../lib';
import * as shared from './shared';
import * as selectors from './selectors';
import autoScrollBehavior from '../autoscroll';

async function* handlePost(post, { cliAPI, loadingInfo }) {
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
    yield lib.stateWithMsgNoWait('Encountered a non-post');
    return;
  }
  await lib.clickWithDelay(maybeA);
  // wait for the post dialog to open and get a reference to that dom element
  const popupDialog = await lib.waitForAndSelectElement(
    document,
    selectors.userDivDialog
  );
  if (!popupDialog) {
    yield lib.stateWithMsgNoWait('Failed to open the post for viewing');
    return;
  }
  yield loadingInfo.viewingPost();
  lib.collectOutlinksFrom(popupDialog);
  // get the next inner div.dialog because its next sibling is the close button
  // until instagram decides to change things
  const innerDivDialog = lib.qs(selectors.userDivDialog, popupDialog);
  // maybe our friendo the close button
  const maybeCloseButton = lib.getElemSibling(innerDivDialog);
  const closeButton = lib.elementsNameEquals(maybeCloseButton, 'button')
    ? maybeCloseButton
    : null;
  // get a reference to the posts contents (div.dialog > article)
  const content = lib.qs(selectors.userPostTopMostContainer, popupDialog);
  // the next image button exists in the popup post even if the post is not
  // multi-image, so lets get a reference to it
  const displayDiv = lib.qs(selectors.userMultiImageDisplayDiv, content);
  let result;
  try {
    result = await shared.handlePostContent({
      thePost: post,
      multiImgElem: content,
      videoElem: displayDiv,
      viewing: shared.ViewingUser,
    });
  } catch (e) {
    result = lib.stateWithMsgNoWait('An error occurred while handling a post');
  }
  yield result;
  const commentList = lib.qs('ul', content);
  if (commentList) {
    yield* shared.loadAllComments(commentList);
    yield* lib.traverseChildrenOf(commentList, shared.commentViewer());
  }
  yield loadingInfo.fullyViewedPost();
  // The load more comments button, depending on the number of comments,
  // will contain two variations of text (see xpathQ for those two variations).
  // getMoreComments handles getting that button for the two variations
  if (closeButton != null) {
    await lib.clickWithDelay(closeButton);
  } else {
    await lib.clickWithDelay(
      lib.xpathOneOf({
        xpg: cliAPI.$x,
        queries: selectors.postPopupCloseXpath,
      })
    );
  }
}

export default function instagramUserBehavior(cliAPI) {
  let preTraversal;
  // view all stories when logged in
  if (shared.loggedIn(cliAPI.$x)) {
    // viewing stories change the markup of the page to be stories mode
    // not timeline mode and reverts back to timeline mode once done #react
    // thus we can only hold a reference to the element that will start
    // a story chain we will view now
    const canViewNormalStories = lib.selectorExists(selectors.userOpenStories);
    const profilePic = lib.qs('img[alt*="profile picture"]');
    let hasSelectedStories = false;
    if (
      profilePic &&
      window.getComputedStyle(profilePic).cursor === 'pointer'
    ) {
      hasSelectedStories = true;
    }
    if (canViewNormalStories && hasSelectedStories) {
      preTraversal = async function*() {
        yield* shared.viewStories(profilePic);
        yield* shared.viewStories(lib.qs(selectors.userOpenStories));
      };
    } else if (hasSelectedStories) {
      preTraversal = () => shared.viewStories(profilePic);
    } else if (canViewNormalStories) {
      preTraversal = () =>
        shared.viewStories(lib.qs(selectors.userOpenStories));
    }
  }
  const loadingInfo = shared.userLoadingInfo();
  return lib.traverseChildrenOfCustom({
    preTraversal,
    additionalArgs: { cliAPI, loadingInfo },
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
      if (loadingInfo) return loadingInfo.hasMorePosts();
      return true;
    },
    wait(parentElement, currentRow) {
      const previousChildCount = parentElement.childElementCount;
      return lib.waitForAdditionalElemChildrenMO(parentElement, {
        max: loadingInfo.ok ? -1 : lib.secondsToDelayAmount(60),
        pollRate: lib.secondsToDelayAmount(2.5),
        guard() {
          const childTest =
            previousChildCount !== parentElement.childElementCount;
          if (!loadingInfo.ok) return childTest;
          return !loadingInfo.hasMorePosts() || childTest;
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
  });
}

export const metadata = {
  name: 'instagramUserBehavior',
  match: {
    regex: /^https:\/\/(www\.)?instagram\.com\/[^/]+(?:\/(?:[?].+)?(?:tagged(?:\/)?)?)?$/,
  },
  description:
    'Capture all stories, images, videos and comments on user’s page.',
  updated: '2019-07-15T22:29:05',
};

export const isBehavior = true;
