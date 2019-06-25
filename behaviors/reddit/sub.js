import * as lib from '../../lib';
import * as selectors from './selectors';
import * as shared from './shared';

/**
 *
 * @param {Element} post
 * @param {{subStructure: SubStructure, cliAPI: Object}} args
 * @return {AsyncIterableIterator<*>}
 */
async function* viewPost(post, { subStructure }) {
  const postTileAndClicker = lib.qs(selectors.APostTitleAndViewClicker, post);
  const postTile = lib.elemInnerText(postTileAndClicker) || 'some post';
  yield lib.stateWithMsgNoWait(`Viewing: ${postTile}`);
  await lib.scrollIntoViewWithDelay(post);
  const postVideo = lib.qs(selectors.APostVideo, post);
  if (postVideo) {
    yield lib.stateWithMsgWaitFromAwaitable(
      lib.noExceptPlayMediaElement(postVideo),
      'Playing posts video'
    );
  }
  await lib.clickWithDelay(postTileAndClicker || post);
  const view = lib.getNthPreviousElementSibling(
    subStructure.bottomMostSubVar,
    2
  );
  if (view) {
    await lib.selectElemFromAndClickWithDelay(
      view,
      selectors.CloseButtonSelector
    );
  } else {
    yield lib.stateWithMsgNoWait('not a post');
  }
}

export default async function* postIterator(cliAPI) {
  const subStructure = shared.getSubStructure();
  yield* lib.traverseChildrenOf2({
    parentElement: subStructure.postList,
    handler: viewPost,
    additionalArgs: { subStructure, cliAPI },
    loader: true,
    filter: shared.isNotPromotedOrAddPost,
    selector: shared.selectPost,
  });
}

export const metaData = {
  name: 'subRedditBehavior',
  description: 'Capture all posts on sub-reddits page.',
  match: {
    regex: /^https:\/\/(www\.)?reddit\.com\/r\/[^/]+(?:\/(?:[a-z]+\/?))?$/,
  }
};

export const isBehavior = true;
