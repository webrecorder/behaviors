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
  const info = {
    state: {
      total: 0,
      viewed: 0,
      viewedFully: 0,
    },
  };
  if (postMain == null) {
    return lib.stateWithMsgNoWait('There was no post', info.state);
  }
  info.state.total = 1;
  info.state.viewed = 1;
  const postId = shared.postId(location);
  let result;
  try {
    result = await shared.handlePostContent({
      thePost: postMain,
      multiImgElem: postMain,
      videoElem: postMain,
      viewing: shared.ViewingSinglePost,
      info,
      postId,
    });
  } catch (e) {
    result = lib.stateWithMsgNoWait(
      `An error occurred while viewing the contents of ${postId}`,
      info.state
    );
  }
  yield result;
  const commentList = lib.qs('ul', postMain);
  if (commentList) {
    yield* shared.viewComments({ commentList, info, postId, $x: cliAPI.$x });
  }
  info.state.viewedFully = 1;
  return lib.stateWithMsgNoWait(`Viewed ${postId}`, info.state);
}

export const metadata = {
  name: 'instagramPostBehavior',
  match: {
    regex: /^https?:\/\/(www\.)?instagram\.com\/p\/[^/]+(?:\/)?$/,
  },
  description:
    'Capture every image and/or video, retrieve all comments, and scroll down to load more.',
  updated: '2019-07-22T20:26:06-04:00',
};

export const isBehavior = true;
