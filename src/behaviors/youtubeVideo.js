import OLC from '../utils/outlinkCollector'
import { getById } from '../utils/dom';
import { clickWithDelay, selectElemAndClick } from '../utils/clicks';
import { selectAndPlay } from '../utils/media';

const selectors = {
  videoInfoMoreId: 'more',
  loadMoreComments: 'div[slot="more-button"] > paper-button',
  commentRenderer: 'ytd-comment-thread-renderer'
};

async function playVideo() {
  await selectAndPlay('video');
}

async function showMoreVideoInfo () {
  const videoInfo =  document.getElementById(selectors.videoInfoMoreId);
  if (videoInfo && !videoInfo.hidden) {
    await clickWithDelay(videoInfo)
  }
}