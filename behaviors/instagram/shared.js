import * as lib from '../../lib';

export const selectors = {
  user: {
    openStories: 'div[aria-label="Open Stories"]',
    nextStory: 'div[class*="RightChevron" i]',
    storyVideo: 'button.videoSpritePlayButton',
    multipleImages: 'span.coreSpriteSidecarIconLarge',
    postTopMostContainer: 'article',
    rightChevron: 'button > div[class*="RightChevron" i]',
    postPopupArticle:
      'div[role="dialog"] > div[role="dialog"] > div[role="dialog"] > article',
    multiImageDisplayDiv: 'div > div[role="button"]',
    playVideo: 'a[role="button"]',
    divDialog: 'div[role="dialog"]',
    divDialogArticle: 'div[role="dialog"] > article'
  },
  post: {
    main: 'section > main > div > div > article',
    nextImage: 'div.coreSpriteRightChevron',
    playVideo: 'span[role="button"].videoSpritePlayButton'
  }
};

export const multiImagePostSelectors = {
  user: [
    'span[aria-label*="Carousel" i]',
    'span[class*="SpriteCarousel" i]',
    'span.coreSpriteSidecarIconLarge'
  ],
  post: ['button > div.coreSpriteRightChevron', 'div.coreSpriteRightChevron']
};

export const videoPostSelectors = {
  user: [
    'span[aria-label*="Video" i]',
    'span[class*="SpriteVideo" i]',
    'span.coreSpriteVideoIconLarge',
    'span[aria-label$="Video" i]',
    'span[class*="glyphsSpriteVideo_large"]'
  ],
  post: [
    'span[role="button"].videoSpritePlayButton',
    'span.videoSpritePlayButton'
  ]
};

export const xpathQ = {
  postPopupClose: [
    '//body/div/div/button[contains(text(), "Close")]',
    '/html/body/div[2]/button[1][contains(text(), "Close")]'
  ],
  loadMoreComments: '//li/button[contains(text(), "Load more comments")]',
  showAllComments: '//li/button[contains(text(), "View all")]',
  loadReplies:
    '//span[contains(text(), "View") and contains(text(), "replies")]',
  notLoggedIn: {
    signUp: '//a[contains(text(), "Sign Up")]',
    login: '//button[contains(text(), "Log In")]'
  }
};

export const multiImageClickOpts = { safety: 30 * 1000, delayTime: 1000 };

export const postTypes = {
  video: Symbol('$$instagram-video-post$$'),
  multiImage: Symbol('$$instagram-multi-image-post$$'),
  commentsOnly: Symbol('$$instagram-comments-only-post$$')
};

/**
 * @param {Element | Node | HTMLElement} post
 * @param {boolean} [isSinglePost]
 * @return {boolean}
 */
export function isVideoPost(post, isSinglePost) {
  const selectors = isSinglePost
    ? videoPostSelectors.post
    : videoPostSelectors.user;
  const results = lib.anySelectorExists(selectors, post);
  return results.success;
}

/**
 * @param {Element | Node | HTMLElement} post
 * @param {boolean} [isSinglePost]
 * @return {boolean}
 */
export function isMultiImagePost(post, isSinglePost) {
  const selectors = isSinglePost
    ? multiImagePostSelectors.post
    : multiImagePostSelectors.user;
  const results = lib.anySelectorExists(selectors, post);
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
  const moreComments = xpg(xpathQ.loadMoreComments, cntx);
  if (moreComments.length === 0) {
    return xpg(xpathQ.showAllComments, cntx)[0];
  }
  return moreComments[0];
}

export async function* loadReplies(xpg, cntx) {
  const moreReplies = xpg(xpathQ.loadReplies, cntx);
  if (moreReplies.length) {
    for (var i = 0; i < moreReplies.length; i++) {
      lib.scrollIntoView(moreReplies[i]);
      await lib.clickWithDelay(moreReplies[i], 500);
      yield lib.stateWithMsgNoWait('Loaded post comment reply');
    }
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
 *
 * @return {?Object}
 */
export function getProfileInfo() {
  if (
    lib.globalWithPropsExist('user', 'username', 'id', 'highlight_reel_count')
  ) {
    return {
      username: window.user.username,
      userId: window.user.id,
      numHighlights: window.user.highlight_reel_count
    };
  }

  const user = lib.getViaPath(
    window,
    '_sharedData',
    'entry_data',
    'ProfilePage',
    0,
    'graphql',
    'user'
  );
  if (user != null) {
    return {
      username: user.username,
      userId: user.id,
      numHighlights: user.highlight_reel_count
    };
  }
  return null;
}
