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
  outlinks: 'ytd-thumbnail > a[id="thumbnail"]',
};

const mutationConf = { attributes: false, childList: true, subtree: false };

function loadMoreComments(cRenderer, selector) {
  const more = lib.qs(selector, cRenderer);
  if (more && !more.hidden) {
    return lib.scrollIntoViewAndClick(more);
  }
  return false;
}

const Reporter = {
  state: {
    loadedVideoInfo: false,
    playedVideo: false,
    viewedComments: 0,
  },
  loadedInfo() {
    this.state.loadedVideoInfo = true;
    return lib.stateWithMsgNoWait('Loaded videos info', this.state);
  },
  playedVideo() {
    this.state.playedVideo = true;
    return lib.stateWithMsgNoWait('Played video', this.state);
  },
  viewedComment() {
    this.state.viewedComments += 1;
    return lib.stateWithMsgNoWait(
      `Viewing video comment #${this.state.viewedComments}`,
      this.state
    );
  },
};

async function* handleComment(comment, mStream) {
  lib.markElemAsVisited(comment);
  await lib.scrollIntoViewWithDelay(comment);
  yield Reporter.viewedComment();
  const replies = lib.qs(selectors.loadedReplies, comment);
  if (
    replies != null &&
    lib.selectorExists('#more > div.more-button', comment)
  ) {
    let totalReplies = 0;
    let next;
    const mutationIter = mStream.predicatedStream(
      replies,
      mutationConf,
      () => loadMoreComments(comment, '#more > div.more-button'),
      () => !lib.selectorExists(selectors.showMoreReplies, comment)
    );
    next = await mutationIter.next();
    while (!next.done) {
      totalReplies += 1;
      await lib.scrollIntoViewWithDelay(replies.lastChild, 750);
      if (!loadMoreComments(comment, selectors.showMoreReplies)) {
        mStream.disconnect();
        break;
      }
      next = await mutationIter.next();
      yield lib.stateWithMsgNoWait(
        `Viewed reply #${totalReplies} of comment #${totalComments}`
      );
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
    yield Reporter.loadedInfo();
  }
  await lib.selectAndPlay('video');
  yield Reporter.loadedInfo();
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

export const metadata = {
  name: 'youtubeVideoBehavior',
  match: {
    regex: /^(?:https:\/\/(?:www\.)?)?youtube\.com\/watch[?]v=.+/,
  },
  description: 'Capture the YouTube video and all comments.',
  updated: '2019-06-24T15:09:02',
};

// playVideoAndLoadComments().then(() => console.log('done'));

export const isBehavior = true;
