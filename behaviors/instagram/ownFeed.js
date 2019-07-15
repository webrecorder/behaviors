import * as lib from '../../lib';
import * as shared from './shared';
import autoScrollBehavior from '../autoscroll';

export default function instagramOwnFeedBehavior(cliAPI) {
  if (!shared.loggedIn(cliAPI.$x)) return autoScrollBehavior();
  // the main feed and latest stories are sibling elements
  const main = lib.qs('main > section');
  const firstPost = lib.qs('article', main.firstElementChild);
  const startStories = lib.qs('a[href="#"]', main.lastElementChild);
  let postContainer;
  if (firstPost) {
    postContainer = firstPost.parentElement;
  }
  return lib.traverseChildrenOfCustom({
    preTraversal:
      startStories != null ? () => shared.viewStories(startStories) : null,
    parentElement: postContainer,
    loader: true,
    async nextChild(parentElement, currentRow) {
      const nextRow = lib.getElemSibling(currentRow);
      if (nextRow) {
        await lib.scrollIntoViewWithDelay(nextRow);
      }
      return nextRow;
    },
    shouldWait(parentElement, currentRow) {
      return currentRow.nextElementSibling == null;
    },
    wait(parentElement, currentRow) {
      const previousChildCount = parentElement.childElementCount;
      return lib.waitForAdditionalElemChildrenMO(parentElement, {
        max: lib.secondsToDelayAmount(45),
        pollRate: lib.secondsToDelayAmount(2.5),
        guard() {
          return previousChildCount !== parentElement.childElementCount;
        },
      });
    },
    async handler(post, additionalArgs) {
      // posts are inline like viewing an individual post
      // however they are not displayed in a pop-up like viewing
      // all posts of some other user meaning we can not view comments
      // only play a video or view multiple images/videos
      let result;
      try {
        result = await shared.handlePostContent({
          viewing: shared.ViewingOwnTimeline,
          thePost: post,
          multiImgElem: post,
          videoElem: post,
        });
      } catch (e) {
        result = lib.stateWithMsgNoWait(
          'An error occurred while handling a post'
        );
      }
      return result;
    },
    setupFailure() {
      // we got nothing at this point, HALP!!!
      lib.collectOutlinksFromDoc();
      lib.autoFetchFromDoc();
      return autoScrollBehavior();
    },
  });
}

export const metadata = {
  name: 'instagramOwnFeedBehavior',
  match: {
    regex: /^https:\/\/(www\.)?instagram\.com(?:\/)?$/,
  },
  description:
    'Capture all stories, images, videos and comments on the logged in users feed.',
  updated: '2019-07-15T22:29:05',
};

export const isBehavior = true;
