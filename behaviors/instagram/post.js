import * as lib from '../../lib';
import {
  determinePostType,
  multiImageClickOpts,
  postTypes,
  selectors,
  viewCommentsAndReplies
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

const contentPrior = window.__$$BPRIOR$$__ || 1;

export default async function* instagramPostBehavior(cliAPI) {
  lib.collectOutlinksFromDoc();
  yield;
  const postMain = getPostMain();
  if (postMain == null) return;
  switch (determinePostType(postMain, true)) {
    case postTypes.multiImage: {
      // display each image by clicking the right chevron (next image)
      await lib.selectFromAndClickUntilNullWithDelay(
        postMain,
        selectors.post.nextImage,
        multiImageClickOpts
      );
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
      break;
  }
  if (contentPrior === 1) {
    yield* viewCommentsAndReplies(cliAPI.$x, postMain);
  }
}

export const metaData = {
  name: 'instagramPostBehavior',
  match: {
    regex: /^https:\/\/(www\.)?instagram\.com\/p\/[^/]+(?:\/)?$/
  },
  description:
    "Views all the content on an instangram User's page: if the user has stories they are viewed, if a users post has image(s)/video(s) they are viewed, and all comments are retrieved",
  priorities: {
    1: 'Full behavior',
    2: 'No comments or replies',
  }
};

export const isBehavior = true;
