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

/**
 * Attempts to create an object that will indicate if the
 * behavior has viewed all the posts by hooking into the
 * underlying react application.
 *
 * An null value is returned if the redux store can not be
 * retrieved or the viewed profile data is not existent
 * @return {?Object}
 */
export function loadingInfoFromStore() {
  const store = (() => {
    const root = lib.getViaPath(
      lib.id('react-root'),
      '_reactRootContainer',
      '_internalRoot'
    );
    if (root) return lib.findReduxStore(root.current);
    return null;
  })();
  if (!store) return null;
  let postsByUserId = lib.getViaPath(
    store.getState(),
    'profilePosts',
    'byUserId'
  );
  if (!postsByUserId) return null;
  const userId = Object.keys(postsByUserId.toJS())[0];
  const info = {
    ok: true,
    haveStore: true,
    postCount: postsByUserId.get(userId).count,
    // pagination info is not added to the information if there are no posts
    allLoaded: !(
      lib.getViaPath(postsByUserId.get(userId), 'pagination', 'hasNextPage') ||
      false
    ),
    viewedPost: () => {},
    viewedPostRow: () => {},
    hasMorePosts() {
      if (this.allLoaded) return false;
      return postsByUserId.get(userId).pagination.hasNextPage;
    },
  };
  if (typeof window.$____$UNSUB$____$ === 'function') {
    window.$____$UNSUB$____$();
  }
  window.$____$UNSUB$____$ = store.subscribe(() => {
    const nextState = store.getState();
    if (postsByUserId !== nextState.profilePosts.byUserId) {
      postsByUserId = nextState.profilePosts.byUserId;
    }
  });
  return info;
}

export function userLoadingInfo() {
  let info = loadingInfoFromStore();
  if (info != null) return info;
  // fallback to a simple counting strategy
  info = {
    ok: false,
    haveStore: false,
    postCount: 0,
    viewed: 0,
    hasMorePosts() {
      return this.viewed < this.postCount;
    },
    viewedPost() {
      this.viewed++;
    },
    viewedPostRow() {
      this.viewed += 3;
    },
  };
  const user = lib.getViaPath(
    window,
    '_sharedData',
    'entry_data',
    'ProfilePage',
    0,
    'graphql',
    'user'
  );
  info.postCount = lib.getViaPath(
    user,
    'edge_owner_to_timeline_media',
    'count'
  );
  if (typeof info.postCount !== 'number') {
    const postCount = (
      lib.elemInnerText(lib.qs(selectors.userPostInfo)) || ''
    ).trim();
    if (postCount && !isNaN(postCount)) {
      info.postCount = Number(postCount);
    }
  }
  info.ok = typeof info.postCount === 'number';
  return info;
}

export function loggedIn(xpg) {
  return (
    lib.hasClass(document.documentElement, 'logged-in') ||
    (xpg(selectors.notLoggedInXpaths.login).length === 0 &&
      xpg(selectors.notLoggedInXpaths.signUp).length === 0)
  );
}
