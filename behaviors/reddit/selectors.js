import * as lib from '../../lib';

export const ReditContainerSelector = 'div[id*="container" i]';
export const CloseButtonSelector = 'button[aria-label="close" i] > span';
export const APost = 'div[class*="post" i]';
export const APostVideo = 'video';
export const APostTitleAndViewClicker = 'a[data-click-id="body"]';
export const APostMediaEmbed = 'iframe[class*="media-element" i]';
export const MaybePromotedSpan = 'div > span';
export const MoreCommentsDivP = 'div[id*="moreComments-" i] > * > p';
export const ViewedPostOverlayScrollContainerId = 'overlayScrollContainer';

export function createSubPartsSelector() {
  const theSub = lib.substringFromIndexOf(location.pathname, '/r/');
  return `div[class="SubredditVars-r-${theSub.replace('/', '')}" i]`;
}

