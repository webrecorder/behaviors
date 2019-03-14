import { getViaPath, globalWithPropsExist } from '../../lib';

export const selectors = {
  openStories: 'div[aria-label="Open Stories"]',
  nextStory: 'div.coreSpriteRightChevron',
  storyVideo: 'button.videoSpritePlayButton',
  multipleImages: 'span.coreSpriteSidecarIconLarge',
  postTopMostContainer: 'article',
  rightChevron: 'button > div.coreSpriteRightChevron',
  postPopupArticle:
    'div[role="dialog"] > div[role="dialog"] > div[role="dialog"] > article',
  multiImageDisplayDiv: 'div > div[role="button"]',
  closeVideo: 'a[role="button"]',
  divDialog: 'div[role="dialog"]',
  divDialogArticle: 'div[role="dialog"] > article'
};

export const videoPostSelectors = [
  'span.coreSpriteVideoIconLarge',
  'span[aria-label$="Video"]',
  'span[class*="glyphsSpriteVideo_large"]'
];

export const xpathQ = {
  postPopupClose: [
    '//body/div/div/button[contains(text(), "Close")]',
    '/html/body/div[2]/button[1]'
  ],
  loadMoreComments: '//li/button[contains(text(), "Load more comments")]',
  showAllComments: '//li/button[contains(text(), "View all")]',
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
 * @return {boolean}
 */
export function isVideoPost(post) {
  for (var i = 0; i < videoPostSelectors.length; ++i) {
    if (post.querySelector(videoPostSelectors[i]) != null) {
      return true;
    }
  }
  return false;
}

/**
 * @param {Element | Node | HTMLElement} post
 */
export function isMultiImagePost(post) {
  return post.querySelector(selectors.multipleImages) != null;
}


/**
 * @desc Determines the type of the post
 * @param {*} post
 * @return {symbol}
 */
export function determinePostType(post) {
  if (isMultiImagePost(post)) return postTypes.multiImage;
  if (isVideoPost(post)) return postTypes.video;
  return postTypes.commentsOnly;
}


/**
 * @desc Executes the xpath query that selects the load more comments button
 * for both variations and returns that element if it exists.
 * @param xpg
 * @return {?Element}
 */
export function getMoreComments(xpg) {
  // first check for load more otherwise return the results of querying
  // for show all comments
  const moreComments = xpg(xpathQ.loadMoreComments);
  if (moreComments.length === 0) {
    return xpg(xpathQ.showAllComments)[0];
  }
  return moreComments[0];
}


/**
 *
 * @return {?Object}
 */
export function getProfileInfo() {
  if (globalWithPropsExist('user', 'username', 'id', 'highlight_reel_count')) {
    return {
      username: window.user.username,
      userId: window.user.id,
      numHighlights: window.user.highlight_reel_count
    };
  }

  const user = getViaPath(
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
