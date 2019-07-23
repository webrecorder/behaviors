export const userOpenStories = 'div[aria-label="Open Stories"]';
export const userNextStory = 'div[class*="RightChevron" i]';
export const userStoryVideo = 'button.videoSpritePlayButton';
export const userMultipleImages = 'span.coreSpriteSidecarIconLarge';
export const userPostTopMostContainer = 'article';
export const userPostPopupArticle =
  'div[role="dialog"] > div[role="dialog"] > div[role="dialog"] > article';
export const userMultiImageDisplayDiv = 'div > div[role="button"]';
export const userPlayVideo = 'a[role="button"]';
export const userDivDialog = 'div[role="dialog"]';
export const userDivDialogArticle = 'div[role="dialog"] > article';
export const userPostInfo =
  'section > main > div > header > section > ul > li > span > span';
export const userMultiImagePostSelectors = [
  'span[aria-label*="Carousel" i]',
  'span[class*="SpriteCarousel" i]',
  'span.coreSpriteSidecarIconLarge',
];

export const userVideoPostSelectors = [
  'span[role="button"].videoSpritopePlayButton',
  'span[aria-label*="Video" i]',
  'span[class*="SpriteVideo" i]',
  'span.coreSpriteVideoIconLarge',
  'span[aria-label$="Video" i]',
  'span[class*="glyphsSpriteVideo_large"]',
];

export const postMain = 'section > main > div > div > article';
export const postNextImage = 'div.coreSpriteRightChevron';
export const postPlayVideo = 'span[role="button"].videoSpritePlayButton';
export const videoSpritePlayButton = '.videoSpritePlayButton';

export const postMultiImagePostSelectors = [
  'button > div.coreSpriteRightChevron',
  'div.coreSpriteRightChevron',
];

export const postVideoPostSelectors = [
  'span[role="button"].videoSpritePlayButton',
  'span.videoSpritePlayButton',
];

export const moreRepliesSpan = '* > button[type="button"] > span';
export const postersOwnComment = 'li[role="menuitem"]';
export const moreCommentsSpanSelector =
  '* > span[aria-label*="more comments" i]';
export const nextImageIconDiv = 'button > div[class*="RightChevron" i]';
export const moreRepliesXpath = '//span[contains(text(), "View replies")]';

export const postPopupCloseXpath = [
  '//body/div/div/button[contains(text(), "Close")]',
  '/html/body/div[2]/button[1][contains(text(), "Close")]',
];

export const loadMoreCommentsXpath =
  '//li/button[contains(text(), "Load more comments")]';
export const showAllCommentsXpath = '//li/button[contains(text(), "View all")]';
export const loadRepliesXpath =
  '//span[contains(text(), "View") and contains(text(), "replies")]';
export const notLoggedInXpaths = {
  signUp: '//a[contains(text(), "Sign Up")]',
  login: '//button[contains(text(), "Log In")]',
};
