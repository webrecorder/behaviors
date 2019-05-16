import * as lib from '../../lib';
import {
  selectors,
  xpathQ,
  postTypes,
  multiImageClickOpts,
  determinePostType,
  getMoreComments,
} from './shared';

const behaviorStyle = lib.addBehaviorStyle(`
  .wr-debug-visited {border: 6px solid #3232F1;}
  .wr-debug-visited-overlay {border: 6px solid pink;}
`);

async function* handlePost(post, xpg) {
  // open the post (displayed in a separate part of the dom)
  // click the first child of the post div (a tag)
  let maybeA = lib.firstChildElementOf(post);
  if (!lib.objectInstanceOf(maybeA, HTMLAnchorElement)) {
    maybeA = lib.qs('a', maybeA);
  }
  if (!maybeA) {
    // we got nothing halp!!!
    return;
  }
  await lib.clickWithDelay(maybeA);
  // wait for the post dialog to open and get a reference to that dom element
  const popupDialog = await lib.waitForAndSelectElement(
    document,
    selectors.divDialog
  );
  // get the next inner div.dialog because its next sibling is the close button
  // until instagram decides to change things
  const innerDivDialog = lib.qs(selectors.divDialog, popupDialog);
  if (debug) {
    lib.addClass(popupDialog, behaviorStyle.wrDebugVisitedOverlay);
  }
  // maybe our friendo the close button
  const maybeCloseButton = lib.getElemSibling(innerDivDialog);
  const closeButton = lib.elementsNameEquals(maybeCloseButton, 'button')
    ? maybeCloseButton
    : null;
  // get a reference to the posts contents (div.dialog > article)
  const content = lib.qs(selectors.divDialogArticle, innerDivDialog);
  // the next image button exists in the popup post even if the post is not
  // multi-image, so lets get a reference to it
  const displayDiv = lib.qs(selectors.multiImageDisplayDiv, content);
  switch (determinePostType(post)) {
    case postTypes.multiImage: {
      // display each image by clicking the right chevron (next image)
      await lib.selectFromAndClickUntilNullWithDelay(
        content,
        selectors.rightChevron,
        multiImageClickOpts
      );
      break;
    }
    case postTypes.video:
      // select and play the video. The video is a mp4 that is already loaded
      // need to only play it for the length of time we are visiting the post
      // just in case
      await lib.selectElemFromAndClickWithDelay(
        displayDiv,
        selectors.playVideo
      );
      break;
    // default: just loading comments
  }
  // The load more comments button, depending on the number of comments,
  // will contain two variations of text (see xpathQ for those two variations).
  // getMoreComments handles getting that button for the two variations
  let moreCommentsButton = getMoreComments(xpg);
  while (moreCommentsButton) {
    await lib.clickWithDelay(moreCommentsButton, 1000);
    moreCommentsButton = getMoreComments(xpg);
    yield;
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

export default async function* instagramTagsBehavior(cliAPI) {
  // tags are split into two separate structures: recent and all
  const postRowContainer = lib.qs(selectors.postTopMostContainer);
  // the number of posts in the recent posts structure is finite, no infinite load
  const recentTags = lib.firstChildElementOf(postRowContainer);
  if (recentTags) {
    yield* lib.traverseChildrenOf(recentTags, handleRow, cliAPI.$x);
  }
  // the number of posts in the all posts structure is infinite, infinite loader
  const allTags = lib.lastChildElementOf(postRowContainer);
  if (allTags) {
    yield* lib.traverseChildrenOfLoaderParent(
      postRowContainer,
      handleRow,
      cliAPI.$x
    );
  }
}
//
// export const metaData = {
//   name: 'instagramTagsBehavior',
//   match: {
//     regex: /^https:\/\/(www\.)?instagram\.com\/explore\/tags\/[^/]+(\/)?$/
//   },
//   description:
//     "Views all the content on the instagram posts that are 'tagged': if the tagged post has image(s)/video(s) they are viewed. By default all comments are retrieved"
// };

// export const isBehavior = true;
