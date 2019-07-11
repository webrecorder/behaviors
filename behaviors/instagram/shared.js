import * as lib from '../../lib';
import * as selectors from './selectors';

export const multiImageClickOpts = { safety: 30 * 1000, delayTime: 1500 };

export const postTypes = {
  video: Symbol('$$instagram-video-post$$'),
  multiImage: Symbol('$$instagram-multi-image-post$$'),
  commentsOnly: Symbol('$$instagram-comments-only-post$$'),
};

/**
 * @param {Element | Node | HTMLElement} post
 * @param {boolean} [isSinglePost]
 * @return {boolean}
 */
export function isVideoPost(post, isSinglePost) {
  const selectorsToUse = isSinglePost
    ? selectors.postVideoPostSelectors
    : selectors.userVideoPostSelectors;
  const results = lib.anySelectorExists(selectorsToUse, post);
  return results.success;
}

/**
 * @param {Element | Node | HTMLElement} post
 * @param {boolean} [isSinglePost]
 * @return {boolean}
 */
export function isMultiImagePost(post, isSinglePost) {
  const selectorsToUse = isSinglePost
    ? selectors.postMultiImagePostSelectors
    : selectors.userMultiImagePostSelectors;
  const results = lib.anySelectorExists(selectorsToUse, post);
  return results.success;
}

/**
 * @desc Determines the type of the post
 * @param {*} post
 * @param {boolean} [isSinglePost]
 * @return {symbol}
 */
export function determinePostType(post, isSinglePost) {
  if (isMultiImagePost(post, isSinglePost)) return postTypes.multiImage;
  if (isVideoPost(post, isSinglePost)) return postTypes.video;
  return postTypes.commentsOnly;
}

/**
 * @desc Executes the xpath query that selects the load more comments button
 * for both variations and returns that element if it exists.
 * @param xpg
 * @param cntx
 * @return {?Element}
 */
export function getMoreComments(xpg, cntx) {
  // first check for load more otherwise return the results of querying
  // for show all comments
  const moreComments = xpg(selectors.loadMoreCommentsXpath, cntx);
  if (moreComments.length === 0) {
    return xpg(selectors.showAllCommentsXpath, cntx)[0];
  }
  return moreComments[0];
}

export async function* loadReplies(xpg, cntx) {
  const moreReplies = xpg(selectors.loadRepliesXpath, cntx);
  if (moreReplies.length) {
    for (var i = 0; i < moreReplies.length; i++) {
      lib.scrollIntoView(moreReplies[i]);
      await lib.clickWithDelay(moreReplies[i], 500);
      yield lib.stateWithMsgNoWait('Loaded post comment reply');
    }
  }
}

export async function* loadAllComments(commentList) {
  // the more comments span, as far as I can tell, can be at
  // the bottom or top of the list depending on how instagram's JS fells
  // so we just gotta find it somewhere as a child of the comment list
  let moreCommentsClicked = 0;
  let moreSpan = lib.qs(selectors.moreCommentsSpanSelector, commentList);
  while (moreSpan) {
    if (!moreSpan.isConnected) break;
    await lib.scrollIntoViewAndClickWithDelay(moreSpan);
    moreCommentsClicked += 1;
    yield lib.stateWithMsgNoWait(
      `Loaded additional comments #${moreCommentsClicked} times`
    );
    moreSpan = lib.qs(selectors.moreCommentsSpanSelector, commentList);
  }
  yield lib.stateWithMsgNoWait('All comments loaded');
}

export function commentViewer() {
  let consumedDummy = false;
  let numComments = 0;
  return async function* viewComment(comment) {
    // the first child of the comment list is an li with a div child
    // this is the posters comment
    lib.collectOutlinksFrom(comment);
    if (!consumedDummy && comment.matches(selectors.postersOwnComment)) {
      consumedDummy = true;
      lib.scrollIntoView(comment);
      yield lib.stateWithMsgNoWait('View posters own comment');
      return;
    }
    // these children are li's with ul child
    numComments += 1;
    yield lib.stateWithMsgNoWait(`Viewed comment ${numComments}`);
    let replies = lib.qs(selectors.moreRepliesSpan, comment);
    // some comments do not need more replies loaded
    if (replies && !lib.elementTextContains(replies, 'hide', true)) {
      let numReplies = 0;
      while (replies) {
        if (!replies.isConnected) break;
        await lib.scrollIntoViewAndClickWithDelay(replies);
        if (lib.elementTextContains(replies, 'hide', true)) {
          break;
        }
        numReplies += 1;
        yield lib.stateWithMsgNoWait(
          `Clicked loaded more replies for comment ${numComments} (#${numReplies} times)`
        );
        replies = lib.qs(selectors.moreRepliesSpan, comment);
      }
      lib.collectOutlinksFrom(comment);
    }
  };
}

/**
 * @param {HTMLElement} content
 * @param {boolean} isSinglePost
 * @return {Promise<number>}
 */
async function viewMultiPost(content, isSinglePost) {
  let numMulti = 0;
  const NextPart = lib.qs(
    isSinglePost ? selectors.postNextImage : selectors.userNextImage,
    content
  );
  const multiList = lib.qs('ul', content);
  let part = multiList.firstElementChild;
  while (part) {
    numMulti += 1;
    const playButton = lib.qs(selectors.videoSpritePlayButton, part);
    if (playButton) {
      const video = lib.qs('video', part);
      if (video) {
        const loadedPromise = lib.uaThinksMediaElementCanPlayAllTheWay(video);
        await lib.clickWithDelay(playButton).then(() => loadedPromise);
      } else {
        await lib.clickWithDelay(playButton);
      }
    }
    part = part.nextElementSibling;
    if (part) {
      await lib.clickWithDelay(NextPart);
    }
  }
  return numMulti;
}

export async function handlePostContent({
  thePost,
  multiImgElem,
  videoElem,
  isSinglePost,
}) {
  const baseMsg = 'Viewed post';
  const result = { msg: null, wait: false };
  switch (determinePostType(thePost, isSinglePost)) {
    case postTypes.multiImage:
      const n = await viewMultiPost(multiImgElem, isSinglePost);
      result.msg = `${baseMsg} with ${n} items`;
      break;
    case postTypes.video:
      // select and play the video. The video is a mp4 that is already loaded
      // need to only play it for the length of time we are visiting the post
      // just in case
      const video = lib.qs('video', videoElem);
      let playthroughp;
      if (video) {
        playthroughp = lib.uaThinksMediaElementCanPlayAllTheWay(video);
      }
      await lib.selectElemFromAndClickWithDelay(
        videoElem,
        isSinglePost ? selectors.postPlayVideo : selectors.userPlayVideo
      );
      if (playthroughp) {
        await playthroughp;
      }
      result.msg = `${baseMsg} with an video`;
      result.wait = true;
      break;
    default:
      result.msg = baseMsg;
      break;
  }
  lib.autoFetchFromDoc();
  lib.collectOutlinksFrom(thePost);
  return result;
}

export async function* viewCommentsAndReplies(xpg, cntx) {
  let more = getMoreComments(xpg, cntx);
  if (!more) {
    yield* loadReplies(xpg, cntx);
  }
  let totalComments = 0;
  while (more) {
    totalComments += 1;
    await lib.clickWithDelay(more, 1000);
    more = getMoreComments(xpg, cntx);
    yield lib.stateWithMsgNoWait(`Loaded post comment #${totalComments}`);
    yield* loadReplies(xpg, cntx);
  }
}

export function initInfo() {
  const sharedData = window._sharedData;
  if (!sharedData) return null;
  const info = {
    type: null,
    loggedIn: false,
    profileId: null,
    postCount: null,
    allLoaded: null,
  };
  if (sharedData.entry_data && sharedData.entry_data.ProfilePage) {
    info.type = 'u';
    const user = sharedData.entry_data.ProfilePage[0].graphql.user;
    // user profile
    if (user) {
      info.profileId = user.id;
      info.postCount = user.edge_owner_to_timeline_media.count;
      info.allLoaded = !user.edge_owner_to_timeline_media.page_info
        .has_next_page;
    }
  }
}

export function userLoadingInfo() {
  const store = (() => {
    const root = lib.getViaPath(
      lib.id('react-root'),
      '_reactRootContainer',
      '_internalRoot'
    );
    if (root) return lib.findReduxStore(root.current);
    return null;
  })();
  if (!store) {
    const user = lib.getViaPath(
      window,
      '_sharedData',
      'entry_data',
      'ProfilePage',
      0,
      'graphql',
      'user'
    );
    if (user) {
      return {
        haveStore: false,
        hasNextPage: () => true,
        postCount: user.edge_owner_to_timeline_media.count,
        allLoaded: !user.edge_owner_to_timeline_media.page_info.has_next_page,
      };
    }
    return null;
  }
  let postsByUserId = store.getState().profilePosts.byUserId;
  const userId = Object.keys(postsByUserId.toJS())[0];
  if (typeof window.$____$UNSUB$____$ === 'function') {
    window.$____$UNSUB$____$();
  }
  window.$____$UNSUB$____$ = store.subscribe(() => {
    const nextState = store.getState();
    if (postsByUserId !== nextState.profilePosts.byUserId) {
      postsByUserId = nextState.profilePosts.byUserId;
    }
  });
  return {
    haveStore: true,
    postCount: postsByUserId.get(userId).count,
    allLoaded: !postsByUserId.get(userId).pagination.hasNextPage,
    hasNextPage: () => postsByUserId.get(userId).pagination.hasNextPage,
    isFetching: () => postsByUserId.get(userId).pagination.isFetching,
    loadedCount: () => postsByUserId.get(userId).pagination.loadedCount,
  };
}

export function loggedIn(xpg) {
  return (
    lib.hasClass(document.documentElement, 'logged-in') ||
    (xpg(selectors.notLoggedInXpaths.login).length === 0 &&
      xpg(selectors.notLoggedInXpaths.signUp).length === 0)
  );
}
