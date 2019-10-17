import * as lib from '../../lib';
import * as shared from './shared';
import autoScrollBehavior from '../autoscroll';

export default function instagramOwnFeedBehavior(cliAPI) {
  if (!shared.loggedIn(cliAPI.$x)) return autoScrollBehavior();
  // the main feed and latest stories are sibling elements
  const info = {
    state: {
      viewed: 0,
      viewedFully: 0,
      viewedStories: false,
    },
    viewedStories() {
      return lib.stateWithMsgNoWait('Viewed stories', this.state);
    },
  };
  return lib.traverseChildrenOfCustom({
    preTraversal() {
      const startStories = lib.qs(
        'a[href="#"]',
        lib.lastChildElementOfSelector('main > section')
      );
      if (startStories) {
        return shared.viewStories(startStories, info);
      }
    },
    setup() {
      // if stories were played we can not hold a reference to the first post
      // since the DOM has changed thus we need perform the setup here
      const firstPost = lib.qs(
        'article',
        lib.firstChildElementOfSelector('main > section')
      );
      if (firstPost) {
        return firstPost.parentElement;
      }
      return null;
    },
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
          content: post,
          info,
          postId: 'a post',
        });
      } catch (e) {
        result = lib.stateWithMsgNoWait(
          'An error occurred while handling a post',
          info.state
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
    postTraversal(failure) {
      const msg = failure
        ? 'Behavior finished due to failure to find posts container, reverted to auto scroll'
        : 'Viewed all posts in the timeline';
      return lib.stateWithMsgNoWait(msg, info.state);
    },
  });
}

export const metadata = {
  name: 'instagramOwnFeedBehavior',
  displayName: 'Instagram User Feed',
  match: {
    regex: /^https?:\/\/(www\.)?instagram\.com(?:\/)?$/,
  },
  description:
    'Capture all stories, images, videos and comments on the logged in users feed.',
  updated: '2019-10-11T17:08:12-04:00',
};

export const isBehavior = true;
