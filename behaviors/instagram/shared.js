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

export function postId(maybePostA) {
  if (maybePostA) {
    /** @type {string} */
    const postPath = maybePostA.pathname;
    const slashBehindId = postPath.indexOf('/', 1);
    return `post ${postPath.substring(
      slashBehindId + 1,
      postPath.lastIndexOf('/')
    )}`;
  }
  return 'post';
}

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

export function commentViewer(info, thePost, $x) {
  let consumedDummy = false;
  let numComments = 0;
  return async function* viewComment(comment) {
    // the first child of the comment list is an li with a div child
    // this is the posters comment
    lib.collectOutlinksFrom(comment);
    if (!consumedDummy && comment.matches(selectors.postersOwnComment)) {
      consumedDummy = true;
      lib.scrollIntoView(comment);
      return lib.stateWithMsgNoWait(
        `View posters own comment to the ${thePost}`,
        info.state
      );
    }
    // these children are li's with ul child
    numComments += 1;
    yield lib.stateWithMsgNoWait(
      `Viewed comment #${numComments} of ${thePost}`,
      info.state
    );

    let replies = $x(selectors.moreRepliesXpath, comment);
    let numReplies = 0;
    while (replies.length) {
      await lib.scrollIntoViewAndClickWithDelay(replies[0]);
      numReplies += 1;
      replies = $x(selectors.moreRepliesXpath, comment);
    }
    if (numReplies) {
      yield lib.stateWithMsgNoWait(
        `Loaded replies for comment #${numComments} of ${thePost} ${numReplies} times`,
        info.state
      );
    }
    lib.collectOutlinksFrom(comment);
  };
}

export async function* viewComments({ commentList, info, postId, $x }) {
  let total = 0;
  let moreSpan = lib.qs(selectors.moreCommentsSpanSelector, commentList);
  while (moreSpan) {
    if (!moreSpan.isConnected) break;
    await lib.scrollIntoViewAndClickWithDelay(moreSpan);
    total += 1;
    yield lib.stateWithMsgNoWait(
      `Loaded additional comments for the ${postId} #${total} times`,
      info.state
    );
    moreSpan = lib.qs(selectors.moreCommentsSpanSelector, commentList);
  }
  yield lib.stateWithMsgNoWait(
    `All comments loaded for ${postId}`,
    info.state
  );
  yield* lib.traverseChildrenOf(commentList, commentViewer(info, postId, $x));
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
  info,
  postId,
}) {
  const baseMsg = `Viewed the contents of ${postId}`;
  const result = { msg: null, wait: false, state: info.state };
  switch (determinePostType(thePost, viewing)) {
    case postTypes.multiImage:
      const n = await viewMultiPost(multiImgElem, viewing);
      result.msg = `${baseMsg} that had #${n} images or videos`;
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
      result.msg = `${baseMsg} that had a video`;
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

export async function* viewStories(startStoriesElem, info, selected) {
  const typeOfStory = selected ? 'selected stories' : 'stories';
  // get the original full URI of the browser
  const originalLoc = window.location.href;
  // ensure we can start the stories
  if (!lib.click(startStoriesElem)) {
    return lib.stateWithMsgNoWait(
      `Failed to start the viewing of ${typeOfStory}`,
      info.state
    );
  }
  // history manipulation will change the browser URI so
  // we must wait for that to happen
  await lib.waitForHistoryManipToChangeLocation(originalLoc);
  let wasClicked;
  let videoButton;
  let msg;
  // stories are sorta on autoplay but we should speed things up
  let toBeClicked = lib.qs(selectors.userNextStory);
  // we will continue to speed up autoplay untill the next story
  // button does not exist or we are done (window.location.href === originalLoc)
  lib.collectOutlinksFromDoc();
  while (!lib.locationEquals(originalLoc) && toBeClicked != null) {
    wasClicked = await lib.clickWithDelay(toBeClicked);
    // if the next story part button was not clicked
    // or autoplay is finished we are done
    if (!wasClicked || lib.locationEquals(originalLoc)) break;
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
      msg = `Viewed a video included in the ${typeOfStory}`;
    } else {
      msg = `Viewed a post of the ${typeOfStory}`;
    }
    yield lib.stateWithMsgNoWait(msg, info.state);
    // safety check due to autoplay
    if (lib.locationEquals(originalLoc)) break;
    toBeClicked = lib.qs(selectors.userNextStory);
  }
  return info.viewedStories(selected);
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

export function userLoadingInfo() {
  const info = {
    postsByUserId: null,
    userId: null,
    store: null,
    ok: false,
    allLoaded: false,
    state: {
      viewedFully: 0,
      total: 0,
      viewedStories: false,
      viewedSelectedStories: false,
    },
    viewingPost(postId) {
      return lib.stateWithMsgNoWait(`Viewing ${postId}`, this.state);
    },
    viewedPostRow() {
      this.state.viewedFully += 3;
      return lib.stateWithMsgNoWait('Viewed three posts', this.state);
    },
    fullyViewedPost(postId) {
      this.state.viewedFully++;
      return lib.stateWithMsgNoWait(`Viewed ${postId}`, this.state);
    },
    viewedStories(selected) {
      if (selected) {
        this.state.viewedStories = true;
      } else {
        this.state.viewedSelectedStories = true;
      }
      return lib.stateWithMsgNoWait(
        selected ? 'Viewed selected stories' : 'Viewed stories',
        this.state
      );
    },
    hasMorePosts() {
      if (this.store) {
        if (this.allLoaded) return false;
        return this.postsByUserId.get(this.userId).pagination.hasNextPage;
      }
      return this.state.viewed < this.total;
    },
    storeUpdate() {
      const nextState = this.store.getState();
      if (this.postsByUserId !== nextState.profilePosts.byUserId) {
        this.postsByUserId = nextState.profilePosts.byUserId;
      }
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
  const initFromStore = (() => {
    const root = lib.getViaPath(
      lib.id('react-root'),
      '_reactRootContainer',
      '_internalRoot'
    );
    if (!root) return false;
    const store = lib.findReduxStore(root.current);
    if (!store) return false;
    const postsByUserId = lib.getViaPath(
      store.getState(),
      'profilePosts',
      'byUserId'
    );
    if (!postsByUserId) return false;
    let userId = Object.keys(postsByUserId.toJS())[0];
    if (!userId || !postsByUserId.get(userId)) {
      if (user && postsByUserId.get(user.id)) {
        userId = user.id;
      } else {
        return false;
      }
    }
    info.store = store;
    info.userId = userId;
    info.postsByUserId = postsByUserId;
    info.state.total = postsByUserId.get(userId).count;
    info.ok = true;
    // pagination info is not added to the information if there are no posts
    info.allLoaded = !(
      lib.getViaPath(postsByUserId.get(userId), 'pagination', 'hasNextPage') ||
      false
    );
    if (typeof window.$____$UNSUB$____$ === 'function') {
      window.$____$UNSUB$____$();
    }
    window.$____$UNSUB$____$ = store.subscribe(info.storeUpdate.bind(info));
    return true;
  })();
  if (initFromStore) return info;
  info.state.total = lib.getViaPath(
    user,
    'edge_owner_to_timeline_media',
    'count'
  );
  if (typeof info.state.total !== 'number') {
    const postCount = (
      lib.elemInnerText(lib.qs(selectors.userPostInfo)) || ''
    ).trim();
    const pcNumber = Number(postCount);
    if (postCount && !isNaN(pcNumber)) {
      info.state.total = pcNumber;
    }
  }
  info.ok = typeof info.state.total === 'number';
  return info;
}

export function loggedIn(xpg) {
  return (
    lib.hasClass(document.documentElement, 'logged-in') ||
    (xpg(selectors.notLoggedInXpaths.login).length === 0 &&
      xpg(selectors.notLoggedInXpaths.signUp).length === 0)
  );
}
