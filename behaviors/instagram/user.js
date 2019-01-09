import * as std from '../../lib';
import { selectors, videoPostSelectors, xpathQ } from './shared';

std.addBehaviorStyle('.wr-debug-visited {border: 6px solid #3232F1;}');

const multiImageClickOpts = { safety: 30 * 1000, delayTime: 1000 };

/**
 * @param {Element | Node | HTMLElement} post
 * @return {boolean}
 */
function isVideoPost(post) {
  let i = 0;
  let len = videoPostSelectors.length;
  for (; i < len; ++i) {
    if (post.querySelector(videoPostSelectors[i]) != null) {
      return true;
    }
  }
  return false;
}

/**
 * @param {Element | Node | HTMLElement} post
 */
function isMultiImagePost(post) {
  return post.querySelector(selectors.multipleImages) != null;
}

/**
 * @desc Opens the selected post. The post element is a div that contains
 * a direct child that is an anchor tag. The anchor tag is the clickable
 * element not the div. Once the post has been determined to be opened,
 * returns the relevant elements of the open post.
 * @param {Element | Node} post
 * @return {Promise<{portal: Element, displayDiv: Element}>}
 */
async function openPost(post) {
  // click the first child of the post div (a tag)
  let maybeA = post.childNodes[0];
  if (!(maybeA instanceof HTMLAnchorElement)) {
    maybeA = std.qs('a', maybeA);
  }
  if (!maybeA) {
    throw new Error('booo');
  }
  await std.clickWithDelay(maybeA);
  // wait for the post portal to open and get a reference to that dom element
  const portal = await std.waitForAndSelectElement(
    document,
    selectors.postPopupArticle
  );
  // get a reference to the post div in the portal
  const displayDiv = portal.querySelector(selectors.multiImageDisplayDiv);
  return { portal, displayDiv };
}

/**
 * @desc Closes the post
 * @param xpg
 * @return {Promise<void>}
 */
async function closePost(xpg) {
  let close = xpg(xpathQ.postPopupClose.v2)[0];
  if (!close) {
    close = xpg(xpathQ.postPopupClose.v1)[0];
  }
  if (close) {
    await std.clickWithDelay(close);
  }
}

/**
 * @desc Executes the xpath query that selects the load more comments button
 * @param xpg
 * @return {Array<Element>}
 */
function getMoreComments(xpg) {
  // first check for load more otherwise return the results of querying
  // for show all comments
  const moreComments = xpg(xpathQ.loadMoreComments);
  if (moreComments.length === 0) return xpg(xpathQ.showAllComments);
  return moreComments;
}

/**
 * @desc The load more comments button, depending on the number of comments,
 * will contain two variations of text (see {@link xpathQ} for those two
 * variations). Calls {@link getMoreComments} and clicks the button returned
 * as the result of the xpath query until it returns an zero length array.
 * @param xpg
 * @return {Promise<void>}
 */
async function loadAllComments(xpg) {
  let moreComments = getMoreComments(xpg);
  while (moreComments.length) {
    await std.clickWithDelay(moreComments[0], 1500);
    moreComments = getMoreComments(xpg);
  }
}

/**
 * @desc Handles the multi-image posts
 * @param {Element | Node | HTMLElement} post
 * @param xpg
 */
async function handleMultiImagePost(post, xpg) {
  // open the post and get references to the DOM structure of the open post
  const { portal } = await openPost(post);
  // display each image by clicking the right chevron (next image)
  await std.selectFromAndClickUntilNullWithDelay(
    portal,
    selectors.rightChevron,
    multiImageClickOpts
  );
  // load all comments and close the post
  await loadAllComments(xpg);
  await closePost(xpg);
}

/**
 * @desc Handles posts that contain videos
 * @param {Element | Node | HTMLElement} post
 * @param xpg
 */
async function handleVideoPost(post, xpg) {
  // open the post and get references to the DOM structure of the open post
  const { displayDiv } = await openPost(post);
  // select and play the video. The video is a mp4 that is already loaded
  // need to only play it for the length of time we are visiting the post
  // just in case
  await std.selectElemFromAndClickWithDelay(displayDiv, selectors.closeVideo);
  // load all comments and close the post
  await loadAllComments(xpg);
  await closePost(xpg);
}

/**
 * @desc Handles posts that are not multi-image or videos
 * @param {Element | Node | HTMLElement} post
 * @param xpg
 */
async function handleCommentsOnly(post, xpg) {
  // open the post and get references to the DOM structure of the open post
  await openPost(post);
  // load all comments and close the post
  await loadAllComments(xpg);
  await closePost(xpg);
}

async function handlePost(post, xpg) {
  std.collectOutlinksFrom(post);
  // scroll it into view and check what type of post it is
  await std.scrollIntoViewWithDelay(post);
  if (isMultiImagePost(post)) {
    await handleMultiImagePost(post, xpg);
  } else if (isVideoPost(post)) {
    await handleVideoPost(post, xpg);
  } else {
    await handleCommentsOnly(post, xpg);
  }
}

async function* viewStories() {
  // get the original full URI of the browser
  const originalLoc = window.location.href;
  // click the first story
  const firstStoryClicked = std.selectElemAndClick(selectors.openStories);
  if (!firstStoryClicked) return; // no storied if
  // history manipulation will change the browser URI so
  // we must wait for that to happen
  await std.waitForHistoryManipToChangeLocation(originalLoc);
  let wasClicked;
  let videoButton;
  // stories are sorta on autoplay but we should speed things up
  let toBeClicked = std.qs(selectors.nextStory);
  // we will continue to speed up autoplay untill the next story
  // button does not exist or we are done (window.location.href === originalLoc)
  while (!std.locationEquals(originalLoc) && toBeClicked != null) {
    wasClicked = await std.clickWithDelay(toBeClicked);
    // if the next story part button was not clicked
    // or autoplay is finished we are done
    if (!wasClicked || std.locationEquals(originalLoc)) break;
    videoButton = std.qs(selectors.storyVideo);
    if (videoButton) {
      // this part of a story is video content
      let maybeVideo = std.qs('video');
      // click the button if not already playing
      if (maybeVideo && maybeVideo.paused) {
        await std.clickWithDelay(videoButton);
      }
      // safety check due to autoplay
      if (std.locationEquals(originalLoc)) break;
      // force play the video if not already playing
      if (maybeVideo && maybeVideo.paused) {
        await std.noExceptPlayMediaElement(maybeVideo);
      }
      // safety check due to autoplay
      if (std.locationEquals(originalLoc)) break;
    }
    yield;
    toBeClicked = std.qs(selectors.nextStory);
  }
}

export default async function* instagramUserBehavior(xpg) {
  // maybe view all stories
  yield* viewStories();
  const scrolDiv = std.qs(selectors.postTopMostContainer);
  const reactGarbageDiv = scrolDiv.firstElementChild;
  if (reactGarbageDiv == null) {
    // we got nothing at this point, HALP!!!
    return;
  }
  // this div is the parent element of the sliding window
  // of posts
  const postRowContainer = reactGarbageDiv.firstElementChild;
  let posts;
  let i = 0;
  let numPosts;
  // a row has three posts
  let row = postRowContainer.firstElementChild;
  // if we go too fast with viewing the currently loaded
  // posts we will encounter a loading phase so we
  // need to know how many are currently loaded
  let numLoadedRows = postRowContainer.children.length;
  while (row != null) {
    if (debug) {
      row.classList.add('wr-debug-visited');
    }
    await std.scrollIntoViewWithDelay(row);
    yield;
    posts = row.childNodes;
    numPosts = posts.length;
    // for each post in the row
    for (i = 0; i < numPosts; ++i) {
      // handle the post
      await handlePost(posts[i], xpg);
      yield;
    }
    numLoadedRows = postRowContainer.children.length;
    // if we are in a loading phase the current row
    // has no element sibling so we are going to wait
    // for it to be loaded, checking for #children updates
    // 7 times
    if (row.nextElementSibling == null) {
      await std.waitForAdditionalElemChildren(postRowContainer, numLoadedRows);
    }
    row = row.nextElementSibling;
  }
}

export const metaData = {
  name: 'instagramUserBehavior',
  match: {
    regex: /^https:\/\/(www\.)?instagram\.com\/[^/]+(\/)?$/
  },
  description:
    "Views all the content on an instangram User's page: if the user has stories they are viewed, if a users post has image(s)/video(s) they are viewed, and all comments are retrieved"
};

export const isBehavior = true;
