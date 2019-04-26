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

async function* handleComment(comment, mStream) {
  lib.markElemAsVisited(comment);
  await lib.scrollIntoViewWithDelay(comment);
  yield;
  const replies = lib.qs(selectors.loadedReplies, comment);
  if (
    replies != null &&
    lib.selectorExists('#more > div.more-button', comment)
  ) {
    let next;
    const mutationIter = mStream.predicatedStream(
      replies,
      mutationConf,
      () => loadMoreComments(comment, '#more > div.more-button'),
      () => !lib.selectorExists(selectors.showMoreReplies, comment)
    );
    next = await mutationIter.next();
    while (!next.done) {
      await lib.scrollIntoViewWithDelay(replies.lastChild, 750);
      if (!loadMoreComments(comment, selectors.showMoreReplies)) {
        mStream.disconnect();
        break;
      }
      next = await mutationIter.next();
      yield;
    }
  }
}

/**
 * @return {AsyncIterableIterator<*>}
 */
export default async function* playVideoAndLoadComments(cliAPI) {
  await lib.scrollWindowByWithDelay(0, 500);
  const moreInfo = lib.chainQs(
    document,
    'ytd-video-secondary-info-renderer',
    'paper-button[id="more"]'
  );
  if (moreInfo != null) {
    await lib.scrollIntoViewAndClick(moreInfo);
    lib.collectOutlinksFromDoc();
    yield;
  }
  await lib.selectAndPlay('video');
  yield;
  await lib.scrollIntoViewAndWaitFor(
    lib.id(selectors.commentsContainerId),
    () => lib.selectorExists(selectors.commentRenderer)
  );
  const relatedVideos = lib.nthChildElemOf(lib.id('related'), 2);
  if (relatedVideos) {
    lib.addOutLinks(lib.qsa(selectors.outlinks, relatedVideos));
  }
  lib.autoFetchFromDoc();
  const commentsContainer = lib.qs('#comments > #sections > #contents');
  const mStream = new lib.MutationStream();
  yield* lib.traverseChildrenOfLoaderParentRemovingPrevious(
    commentsContainer,
    handleComment,
    mStream
  );
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
