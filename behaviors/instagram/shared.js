import * as lib from '../../lib';
import * as selectors from './selectors';

export const postTypes = {
  video: Symbol('$$instagram-video-post$$'),
  multiImage: Symbol('$$instagram-multi-image-post$$'),
  commentsOnly: Symbol('$$instagram-comments-only-post$$'),
};

export const ViewingOwnTimeline = Symbol('$$instagram-viewing-own-timeline');
export const ViewingUser = Symbol('$$instagram-viewing-user$$');
export const ViewingSinglePost = Symbol('$$instagram-viewing-single-post$$');

/**
 * @param {Element | Node | HTMLElement} post
 * @param {symbol} [viewing]
 * @return {boolean}
 */
export function isVideoPost(post, viewing) {
  let selectors_;
  switch (viewing) {
    case ViewingOwnTimeline:
    case ViewingSinglePost:
      selectors_ = selectors.postVideoPostSelectors;
      break;
    default:
      selectors_ = selectors.userVideoPostSelectors;
      break;
  }
  return lib.anySelectorExists(selectors_, post).success;
}

/**
 * @param {Element | Node | HTMLElement} post
 * @param {symbol} [viewing]
 * @return {boolean}
 */
export function isMultiImagePost(post, viewing) {
  if (viewing === ViewingOwnTimeline) {
    return lib.selectorExists(selectors.nextImageIconDiv, post);
  }
  const selectors_ =
    viewing === ViewingUser
      ? selectors.userMultiImagePostSelectors
      : selectors.postMultiImagePostSelectors;
  return lib.anySelectorExists(selectors_, post).success;
}

/**
 * @desc Determines the type of the post
 * @param {*} post
 * @param {symbol} [viewing]
 * @return {symbol}
 */
export function determinePostType(post, viewing) {
  if (isMultiImagePost(post, viewing)) return postTypes.multiImage;
  if (isVideoPost(post, viewing)) return postTypes.video;
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
 * @param {Element} content
 * @param {symbol} viewing
 * @return {Promise<number>}
 */
export async function viewMultiPost(content, viewing) {
  let numMulti = 0;
  const NextPart = lib.qs(
    viewing === ViewingSinglePost
      ? selectors.postNextImage
      : selectors.nextImageIconDiv,
    content
  );
  const multiList = lib.qs('ul', content);
  if (!multiList) return 0;
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
  viewing,
}) {
  const baseMsg = 'Viewed post';
  const result = { msg: null, wait: false };
  switch (determinePostType(thePost, viewing)) {
    case postTypes.multiImage:
      const n = await viewMultiPost(multiImgElem, viewing);
      result.msg = `${baseMsg} with ${n} images or videos`;
      break;
    case postTypes.video:
      // select and play the video. The video is maybe an mp4 that is already loaded
      // need to only play it for the length of time we are visiting the post
      // just in case
      const video = lib.qs('video', videoElem);
      let playthroughp;
      if (video) {
        playthroughp = lib.uaThinksMediaElementCanPlayAllTheWay(video);
      }
      await lib.selectElemFromAndClickWithDelay(
        videoElem,
        viewing === ViewingSinglePost
          ? selectors.postPlayVideo
          : selectors.userPlayVideo
      );
      if (playthroughp) {
        await playthroughp;
      }
      result.msg = `${baseMsg} with video`;
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

export async function* viewStories(startStoriesElem) {
  // get the original full URI of the browser
  const originalLoc = window.location.href;
  // ensure we can start the stories
  if (!lib.click(startStoriesElem)) return;
  // history manipulation will change the browser URI so
  // we must wait for that to happen
  await lib.waitForHistoryManipToChangeLocation(originalLoc);
  let wasClicked;
  let videoButton;
  // stories are sorta on autoplay but we should speed things up
  let toBeClicked = lib.qs(selectors.userNextStory);
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
    videoButton = lib.qs(selectors.userStoryVideo);
    if (videoButton) {
      // this part of a story is video content
      let maybeVideo = lib.qs('video');
      // click the button if not already playing
      if (maybeVideo) {
        await lib.clickWithDelay(videoButton);
      }
      // safety check due to autoplay
      if (lib.locationEquals(originalLoc)) break;
      // force play the video if not already playing
      if (maybeVideo && maybeVideo.paused) {
        await lib.noExceptPlayMediaElement(maybeVideo);
      }
      yield lib.stateWithMsgNoWait(`Viewed video of story #${totalStories}`);
    } else {
      yield lib.stateWithMsgNoWait(`Viewed story #${totalStories}`);
    }
    // safety check due to autoplay
    if (lib.locationEquals(originalLoc)) break;
    toBeClicked = lib.qs(selectors.userNextStory);
  }
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
    counts: {
      viewed: 0,
      viewedFully: 0,
      total: postsByUserId.get(userId).count,
    },
    haveStore: true,
    // pagination info is not added to the information if there are no posts
    allLoaded: !(
      lib.getViaPath(postsByUserId.get(userId), 'pagination', 'hasNextPage') ||
      false
    ),
    viewingPost() {
      this.counts.viewed++;
      return lib.stateWithMsgNoWait('Viewing post', this.counts);
    },
    viewedPostRow() {
      this.counts.viewed += 3;
    },
    fullyViewedPost() {
      this.counts.viewedFully++;
      return lib.stateWithMsgNoWait('Viewed post', this.counts);
    },
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
    counts: {
      viewed: 0,
      viewedFully: 0,
      total: 0,
    },
    hasMorePosts() {
      return this.counts.viewed < this.total;
    },
    viewingPost() {
      this.counts.viewed++;
      return lib.stateWithMsgNoWait('Viewing post', this.counts);
    },
    viewedPostRow() {
      this.counts.viewed += 3;
    },
    fullyViewedPost() {
      this.counts.viewedFully++;
      return lib.stateWithMsgNoWait('Viewed post', this.counts);
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
  info.counts.total = lib.getViaPath(
    user,
    'edge_owner_to_timeline_media',
    'count'
  );
  if (typeof info.counts.total !== 'number') {
    const postCount = (
      lib.elemInnerText(lib.qs(selectors.userPostInfo)) || ''
    ).trim();
    if (postCount && !isNaN(postCount)) {
      info.counts.total = Number(postCount);
    }
  }
  info.ok = typeof info.total === 'number';
  return info;
}

export function loggedIn(xpg) {
  return (
    lib.hasClass(document.documentElement, 'logged-in') ||
    (xpg(selectors.notLoggedInXpaths.login).length === 0 &&
      xpg(selectors.notLoggedInXpaths.signUp).length === 0)
  );
}
