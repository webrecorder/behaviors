import {
  id,
  markElemAsVisited,
  qs,
  qsa,
  selectorExists,
  nthChildElemOf
} from '../utils/dom';
import { waitForAdditionalElemChildren } from '../utils/delays';
import { clickWithDelay, scrollIntoViewAndClick } from '../utils/clicks';
import { selectAndPlay } from '../utils/media';
import {
  scrollIntoViewAndWaitFor,
  scrollIntoViewWithDelay
} from '../utils/scrolls';
import { MutationStream } from '../utils/mutations';
import {addOutLinks} from '../utils/outlinkCollector';

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
  if (replies != null && selectorExists('#more > div.more-button', renderer)) {
    // console.log('rendered has replies', replies);
    let mutation;
    for await (mutation of mStream.predicatedStream(
      replies,
      mutationConf,
      () => loadMoreComments(renderer, '#more > div.more-button'),
      () => !selectorExists(selectors.showMoreReplies, renderer)
    )) {
      // console.log(mutation);
      await scrollIntoViewWithDelay(replies.lastChild, 750);
      if (!loadMoreComments(renderer, selectors.showMoreReplies)) {
        mStream.disconnect();
        break;
      }
    }
    // console.log('consumed all renderer comments', renderer);
  }
}

function nextComment(elem) {
  const next = elem.nextElementSibling;
  elem.remove();
  return next;
}

async function* playVideoAndLoadComments() {
// async function playVideoAndLoadComments() {
  await selectAndPlay('video');
  const videoInfo = id(selectors.videoInfoMoreId);
  if (videoInfo && !videoInfo.hidden) {
    await clickWithDelay(videoInfo);
  }
  await scrollIntoViewAndWaitFor(id(selectors.commentsContainerId), () =>
    selectorExists(selectors.commentRenderer)
  );
  const relatedVideos = nthChildElemOf(id('related'), 2);
  if (relatedVideos) {
    addOutLinks(qsa(selectors.outlinks, relatedVideos));
  }
  const commentsContainer = qs('#comments > #sections > #contents');
  const mStream = new MutationStream();
  let comment = commentsContainer.children[0];
  let numLoadedComments = commentsContainer.children.length;
  while (comment != null) {
    // console.log('viewing comment', comment);
    markElemAsVisited(comment);
    await scrollIntoViewWithDelay(comment);
    await viewAllReplies(mStream, comment);
    numLoadedComments = commentsContainer.children.length;
    if (comment.nextElementSibling == null) {
      // console.log('waiting for more comments to load');
      await waitForAdditionalElemChildren(commentsContainer, numLoadedComments);
      // console.log(
      //   `next loaded size ${numLoadedComments}, next comment = `,
      //   comment.nextElementSibling
      // );
    }
    yield comment;
    comment = nextComment(comment);
  }
}

window.$WRIterator$ = playVideoAndLoadComments();
window.$WRIteratorHandler$ = async function() {
  const next = await $WRIterator$.next();
  return next.done;
};

// playVideoAndLoadComments().then(() => console.log('done'));
