import * as lib from '../lib';

const selectors = {
  videoInfoMoreId: 'more',
  loadMoreComments: 'div[slot="more-button"] > paper-button',
  showMoreReplies: 'yt-next-continuation > paper-button',
  commentRenderer: 'ytd-comment-thread-renderer',
  commentsContainerId: 'comments',
  loadedReplies: 'div[id="loaded-replies"]',
  loadingCommentsSpinner:
    '#continuations > yt-next-continuation > paper-spinner',
  outlinks: 'ytd-thumbnail > a[id="thumbnail"]'
};

const mutationConf = { attributes: false, childList: true, subtree: false };

function loadMoreComments(cRenderer, selector) {
  const more = lib.qs(selector, cRenderer);
  if (more && !more.hidden) {
    return lib.scrollIntoViewAndClick(more);
  }
  return false;
}

/**
 *
 * @param {MutationStream} mStream
 * @param renderer
 * @return {AsyncIterator<*>}
 */
async function viewAllReplies(mStream, renderer) {
  const replies = lib.qs(selectors.loadedReplies, renderer);
  if (
    replies != null &&
    lib.selectorExists('#more > div.more-button', renderer)
  ) {
    let mutation;
    for await (mutation of mStream.predicatedStream(
      replies,
      mutationConf,
      () => loadMoreComments(renderer, '#more > div.more-button'),
      () => !lib.selectorExists(selectors.showMoreReplies, renderer)
    )) {
      await lib.scrollIntoViewWithDelay(replies.lastChild, 750);
      if (!loadMoreComments(renderer, selectors.showMoreReplies)) {
        mStream.disconnect();
        break;
      }
    }
  }
}

/**
 *
 * @return {AsyncIterableIterator<*>}
 */
export default async function* playVideoAndLoadComments() {
  await lib.scrollWindowByWithDelay(0, 500);
  const moreInfo = lib.chainQs(
    document,
    'ytd-video-secondary-info-renderer',
    'paper-button[id="more"]'
  );
  if (moreInfo != null) {
    await lib.scrollIntoViewAndClick(moreInfo);
    yield;
  }
  await lib.selectAndPlay('video');
  yield;
  await lib.scrollIntoViewAndWaitFor(lib.id(selectors.commentsContainerId), () =>
    lib.selectorExists(selectors.commentRenderer)
  );
  const relatedVideos = lib.nthChildElemOf(lib.id('related'), 2);
  if (relatedVideos) {
    lib.addOutLinks(lib.qsa(selectors.outlinks, relatedVideos));
  }
  const commentsContainer = lib.qs('#comments > #sections > #contents');
  const mStream = new lib.MutationStream();
  let comment = commentsContainer.children[0];
  let numLoadedComments = commentsContainer.children.length;
  while (comment != null) {
    lib.markElemAsVisited(comment);
    await lib.scrollIntoViewWithDelay(comment);
    yield;
    await viewAllReplies(mStream, comment);
    numLoadedComments = commentsContainer.children.length;
    if (comment.nextElementSibling == null) {
      await lib.waitForAdditionalElemChildren(
        commentsContainer,
        numLoadedComments
      );
    }
    yield;
    comment = lib.getElemSiblingAndRemoveElem(comment);
  }
}

export const metaData = {
  name: 'youtubeVideoBehavior',
  match: {
    regex: /^(?:https:\/\/(?:www\.)?)?youtube\.com\/watch[?]v=.+/
  },
  description: 'Plays a YouTube video and loads all comments'
};

// playVideoAndLoadComments().then(() => console.log('done'));

export const isBehavior = true;
