import OLC from '../utils/outlinkCollector';
import { id, markElemAsVisited, selectorExists, MutationStream, qs } from '../utils/dom';
import { clickAndWaitFor, clickWithDelay, selectElemAndClick } from '../utils/clicks';
import { selectAndPlay } from '../utils/media';
import { scrollIntoViewAndWaitFor, scrollIntoViewWithDelay } from '../utils/scrolls';

const selectors = {
  videoInfoMoreId: 'more',
  loadMoreComments: 'div[slot="more-button"] > paper-button',
  commentRenderer: 'ytd-comment-thread-renderer',
  commentsContainerId: 'comments'
};

const commentsXpathQ = `//${
  selectors.commentRenderer
}[not(contains(@class, "wrvistited"))]`;

async function playVideoAndLoadComments(xpg) {
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
  while (commentRenderers.length > 0) {
    len  = commentRenderers.length;
    for(i = 0; i < len; ++i) {
      renderer = commentRenderers[i];
      markElemAsVisited(renderer);
      await scrollIntoViewWithDelay(renderer);
      let more = qs(selectors.moreComments, renderer);
      if (more) {
        await clickAndWaitFor(more, () => selectorExists(, renderer))
      }

    }
  }
}

playVideoAndLoadComments();
