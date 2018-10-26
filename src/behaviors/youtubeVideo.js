import {
  attrEq,
  id,
  markElemAsVisited,
  maybePolyfillXPG,
  MutationStream,
  qs,
  selectorExists
} from '../utils/dom';
import { clickWithDelay, scrollIntoViewAndClick } from '../utils/clicks';
import { selectAndPlay } from '../utils/media';
import {
  scrollIntoViewAndWaitFor,
  scrollIntoViewWithDelay
} from '../utils/scrolls';
import {
  delay,
  waitForPredicate,
  waitForPredicateAtMax
} from '../utils/delays';

const selectors = {
  videoInfoMoreId: 'more',
  loadMoreComments: 'div[slot="more-button"] > paper-button',
  showMoreReplies: 'yt-next-continuation > paper-button',
  commentRenderer: 'ytd-comment-thread-renderer',
  commentsContainerId: 'comments',
  loadedReplies: 'div[id="loaded-replies"]',
  loadingCommentsSpinner:
    '#continuations > yt-next-continuation > paper-spinner'
};

const commentsXpathQ = `//${
  selectors.commentRenderer
}[not(contains(@class, "wrvistited"))]`;

const commentsVisitedXpathQ = `//${
  selectors.commentRenderer
}[contains(@class, "wrvistited")]`;

const mutationConf = { attributes: false, childList: true, subtree: false };

function loadMoreComments(cRenderer, selector) {
  const more = qs(selector, cRenderer);
  if (more && !more.hidden) {
    return scrollIntoViewAndClick(more);
  }
  return false;
}

/**
 *
 * @param {MutationStream} mStream
 * @param renderer
 * @return {Promise<void>}
 */
async function viewAllReplies(mStream, renderer) {
  const replies = qs(selectors.loadedReplies, renderer);
  if (replies != null) {
    // console.log('rendered has replies', replies);
    let mutation;
    for await (mutation of mStream.predicatedStream(
      replies,
      mutationConf,
      () => loadMoreComments(renderer, selectors.loadMoreComments),
      () => !selectorExists(selectors.showMoreReplies, renderer)
    )) {
      // console.log(mutation);
      await scrollIntoViewWithDelay(replies.lastChild, 500);
      if (!loadMoreComments(renderer, selectors.showMoreReplies)) {
        mStream.disconnect();
        break;
      }
    }
    // console.log('consumed all renderer comments', renderer);
  }
}

async function nextSetOfComments(xpg) {
  let comments = xpg(commentsXpathQ);
  if (comments.length === 0) {
    // console.log('waiting for comments to load');
    for (let i = 0; i < 6; i++) {
      comments = xpg(commentsXpathQ);
      if (comments.length > 0) return comments;
      await delay(1000);
    }
    // console.log('comments loaded or hit max wait of 5 seconds');
    return xpg(commentsXpathQ);
  }
  return comments;
}

async function pruneVisited(xpg) {
  const visited = xpg(commentsVisitedXpathQ);
  let i = 0;
  for (; i < visited.length; i++) {
    visited[i].remove();
  }
}

async function* playVideoAndLoadComments(xpg) {
  await selectAndPlay('video');
  const videoInfo = id(selectors.videoInfoMoreId);
  if (videoInfo && !videoInfo.hidden) {
    await clickWithDelay(videoInfo);
  }
  await scrollIntoViewAndWaitFor(id(selectors.commentsContainerId), () =>
    selectorExists(selectors.commentRenderer)
  );
  const mStream = new MutationStream();
  let commentRenderers = xpg(commentsXpathQ);
  let len;
  let i;
  let renderer;
  let visited = 0;
  while (commentRenderers.length > 0) {
    len = commentRenderers.length;
    for (i = 0; i < len; ++i) {
      visited += 1;
      renderer = commentRenderers[i];
      yield renderer;
      markElemAsVisited(renderer);
      // console.log('next renderer', renderer);
      await scrollIntoViewWithDelay(renderer);
      await viewAllReplies(mStream, renderer);
    }
    if (visited >= 100) {
      await pruneVisited(xpg);
      visited = 0;
    }
    commentRenderers = await nextSetOfComments(xpg);
    // console.log(commentRenderers);
  }
}


window.$WRIterator$ = playVideoAndLoadComments(maybePolyfillXPG(xpg));
window.$WRIteratorHandler$ = async function() {
  const next = await $WRIterator$.next();
  return next.done;
};

// playVideoAndLoadComments(maybePolyfillXPG(xpg));
