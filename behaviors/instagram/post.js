import * as lib from '../../lib';
import * as shared from './shared';
import * as selectors from './selectors';

function getPostMain() {
  let maybeArticle = lib.qs(selectors.postMain);
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
  const postMain = getPostMain();
  if (postMain == null) {
    yield lib.stateWithMsgNoWait('There was no post');
    return;
  }
  yield lib.stateWithMsgNoWait('Viewing the post');
  const { msg, wait } = await shared.handlePostContent({
    thePost: postMain,
    multiImgElem: postMain,
    videoElem: postMain,
    isSinglePost: true,
  });
  yield lib.createState(wait, msg);
  const commentList = lib.qs('ul', postMain);
  if (commentList) {
    yield* shared.loadAllComments(commentList);
    yield* lib.traverseChildrenOf(commentList, shared.commentViewer());
  }
}

export const metadata = {
  name: 'instagramPostBehavior',
  match: {
    regex: /^https:\/\/(www\.)?instagram\.com\/p\/[^/]+(?:\/)?$/,
  },
  description:
    'Capture every image and/or video, retrieve all comments, and scroll down to load more.',
  updated: '2019-06-25T16:16:14',
};

export const isBehavior = true;
