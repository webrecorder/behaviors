import * as lib from '../../lib';
import {
  commentViewer,
  determinePostType,
  loadAllComments,
  multiImageClickOpts,
  postTypes,
  selectors,
  xpathQ,
} from './shared';

let behaviorStyle;
if (debug) {
  behaviorStyle = lib.addBehaviorStyle(`
  .wr-debug-visited {border: 6px solid #3232F1;}
  .wr-debug-visited-overlay {border: 6px solid pink;}
`);
}

function loggedIn(xpg) {
  return (
    xpg(xpathQ.notLoggedIn.login).length === 0 &&
    xpg(xpathQ.notLoggedIn.signUp).length === 0
  );
}

async function* viewStories() {
  // get the original full URI of the browser
  const originalLoc = window.location.href;
  // click the first story
  const firstStoryClicked = lib.selectElemAndClick(selectors.user.openStories);
  if (!firstStoryClicked) return; // no storied if
  // history manipulation will change the browser URI so
  // we must wait for that to happen
  await lib.waitForHistoryManipToChangeLocation(originalLoc);
  let wasClicked;
  let videoButton;
  // stories are sorta on autoplay but we should speed things up
  let toBeClicked = lib.qs(selectors.user.nextStory);
  // we will continue to speed up autoplay untill the next story
  // button does not exist or we are done (window.location.href === originalLoc)
  lib.collectOutlinksFromDoc();
  let totalStories = 0;
  while (!lib.locationEquals(originalLoc) && toBeClicked != null) {
    wasClicked = await lib.clickWithDelay(toBeClicked);
    // if the next story part button was not clicked
    // or autoplay is finished we are done
    if (!wasClicked || lib.locationEquals(originalLoc)) break;
    totalStories += 1;
    videoButton = lib.qs(selectors.user.storyVideo);
    if (videoButton) {
      // this part of a story is video content
      let maybeVideo = lib.qs('video');
      // click the button if not already playing
      if (maybeVideo && maybeVideo.paused) {
        await lib.clickWithDelay(videoButton);
      }
      // safety check due to autoplay
      if (lib.locationEquals(originalLoc)) break;
      // force play the video if not already playing
      if (maybeVideo && maybeVideo.paused) {
        await lib.noExceptPlayMediaElement(maybeVideo);
      }
      yield lib.stateWithMsgNoWait(`Viewed video of story #${totalStories}`);
      // safety check due to autoplay
      if (lib.locationEquals(originalLoc)) break;
    } else {
      yield lib.stateWithMsgNoWait(`Viewed story #${totalStories}`);
    }
    toBeClicked = lib.qs(selectors.user.nextStory);
  }
}

async function* handlePost(post, xpg) {
  // open the post (displayed in a separate part of the dom)
  // click the first child of the post div (a tag)
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
    selectors.user.divDialog
  );
  lib.collectOutlinksFrom(popupDialog);
  // get the next inner div.dialog because its next sibling is the close button
  // until instagram decides to change things
  const innerDivDialog = lib.qs(selectors.user.divDialog, popupDialog);
  if (debug) {
    lib.addClass(popupDialog, behaviorStyle.wrDebugVisitedOverlay);
  }
  // maybe our friendo the close button
  const maybeCloseButton = lib.getElemSibling(innerDivDialog);
  const closeButton = lib.elementsNameEquals(maybeCloseButton, 'button')
    ? maybeCloseButton
    : null;
  // get a reference to the posts contents (div.dialog > article)
  const content = lib.qs(selectors.user.divDialogArticle, innerDivDialog);
  // the next image button exists in the popup post even if the post is not
  // multi-image, so lets get a reference to it
  const displayDiv = lib.qs(selectors.user.multiImageDisplayDiv, content);
  const baseMsg = 'Viewed post';
  let postTypeMsg;
  switch (determinePostType(post)) {
    case postTypes.multiImage: {
      // display each image by clicking the right chevron (next image)
      const numImages = await lib.selectFromAndClickUntilNullWithDelay(
        content,
        selectors.user.rightChevron,
        multiImageClickOpts
      );
      postTypeMsg = `with ${numImages} images`;
      break;
    }
    case postTypes.video:
      // select and play the video. The video is a mp4 that is already loaded
      // need to only play it for the length of time we are visiting the post
      // just in case
      await lib.selectElemFromAndClickWithDelay(
        displayDiv,
        selectors.user.playVideo
      );
      postTypeMsg = 'with an video';
      break;
    // default: just loading comments
  }
  // The load more comments button, depending on the number of comments,
  // will contain two variations of text (see xpathQ for those two variations).
  // getMoreComments handles getting that button for the two variations
  yield lib.stateWithMsgNoWait(`${baseMsg}${postTypeMsg ? postTypeMsg : ''}`);
  const commentList = lib.qs('ul', content);
  if (commentList) {
    yield* loadAllComments(commentList);
    yield* lib.traverseChildrenOf(commentList, commentViewer());
  }
  if (closeButton != null) {
    await lib.clickWithDelay(closeButton);
  } else {
    await lib.clickWithDelay(
      lib.xpathOneOf({
        xpg,
        queries: xpathQ.postPopupClose,
      })
    );
  }
}

/**
 * @desc
 * @param {Element} row
 * @param {*} xpg
 * @return {AsyncIterableIterator<*>}
 */
async function* handleRow(row, xpg) {
  if (debug) {
    lib.addClass(row, behaviorStyle.wrDebugVisited);
  }
  await lib.scrollIntoViewWithDelay(row);
  yield* lib.traverseChildrenOf(row, handlePost, xpg);
}

export default async function* instagramUserBehavior(cliAPI) {
  // view all stories when logged in
  if (loggedIn(cliAPI.$x)) {
    yield* viewStories();
  }
  const postRowContainer = lib.chainFistChildElemOf(
    lib.qs(selectors.user.postTopMostContainer),
    2
  );
  if (postRowContainer == null) {
    // we got nothing at this point, HALP!!!
    lib.collectOutlinksFromDoc();
    lib.autoFetchFromDoc();
    yield lib.stateWithMsgNoWait('There was no post');
    return;
  }
  // for each post row view the posts it contains
  yield* lib.traverseChildrenOfLoaderParent(
    postRowContainer,
    handleRow,
    cliAPI.$x
  );
}

export const metaData = {
  name: 'instagramUserBehavior',
  match: {
    regex: /^https:\/\/(www\.)?instagram\.com\/[^/]+(?:\/(?:tagged(?:\/)?)?)?$/,
  },
  description:
    "Views all the content on an instangram User's page: if the user has stories they are viewed, if a users post has image(s)/video(s) they are viewed, and all comments are retrieved",
};

export const isBehavior = true;
