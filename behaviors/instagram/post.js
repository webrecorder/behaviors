import * as lib from '../../lib';
import {
  commentViewer,
  determinePostType,
  loadAllComments,
  multiImageClickOpts,
  postTypes,
  selectors,
} from './shared';

function getPostMain() {
  let maybeArticle = lib.qs(selectors.post.main);
  if (!lib.elementsNameEquals(maybeArticle, 'article')) {
    maybeArticle = lib.chainFistChildElemOf(document.body, 6);
  }
  if (!lib.elementsNameEquals(maybeArticle, 'article')) {
    return null;
  }
  return maybeArticle;
}

export default async function* instagramPostBehavior(cliAPI) {
  lib.collectOutlinksFromDoc();
  yield;
  const postMain = getPostMain();
  if (postMain == null) {
    yield lib.stateWithMsgNoWait('There was no post');
    return;
  }
  const baseMsg = 'Viewed post';
  let postTypeMsg;
  switch (determinePostType(postMain, true)) {
    case postTypes.multiImage: {
      // display each image by clicking the right chevron (next image)
      const numImages = await lib.selectFromAndClickUntilNullWithDelay(
        postMain,
        selectors.post.nextImage,
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
        postMain,
        selectors.post.playVideo
      );
      postTypeMsg = 'with an video';
      break;
  }
  yield lib.stateWithMsgNoWait(`${baseMsg}${postTypeMsg ? postTypeMsg : ''}`);
  const commentList = lib.qs('ul', postMain);
  if (commentList) {
    yield* loadAllComments(commentList);
    yield* lib.traverseChildrenOf(commentList, commentViewer());
  }
}

export const metaData = {
  name: 'instagramPostBehavior',
  match: {
    regex: /^https:\/\/(www\.)?instagram\.com\/p\/[^/]+(?:\/)?$/,
  },
  description:
    'Capture every image and/or video, retrieve all comments, and scroll down to load more.'
};

export const isBehavior = true;
