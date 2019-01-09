import { getViaPath, globalWithPropsExist } from '../../lib';

export const selectors = {
  openStories: 'div[aria-label="Open Stories"]',
  nextStory: 'div.coreSpriteRightChevron',
  storyVideo: 'button.videoSpritePlayButton',
  multipleImages: 'span.coreSpriteSidecarIconLarge',
  postTopMostContainer: 'article',
  rightChevron: 'button > div.coreSpriteRightChevron',
  postPopupArticle: `${new Array(3)
    .fill(0)
    .map(() => 'div[role="dialog"]')
    .join(' > ')} > article`,
  multiImageDisplayDiv: 'div > div[role="button"]',
  closeVideo: 'a[role="button"]'
};

export const videoPostSelectors = [
  'span.coreSpriteVideoIconLarge',
  'span[aria-label$="Video"]',
  'span[class*="glyphsSpriteVideo_large"]'
];

export const xpathQ = {
  postPopupClose: {
    v1: '//body/div/div/button[contains(text(), "Close")]',
    v2: '/html/body/div[2]/button[1]'
  },
  loadMoreComments: '//li/button[contains(text(), "Load more comments")]',
  showAllComments: '//li/button[contains(text(), "View all")]'
};

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
