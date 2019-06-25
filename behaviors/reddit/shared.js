import * as lib from '../../lib';
import * as selectors from './selectors';

/**
 *
 * @return {SubStructure}
 */
export function getSubStructure() {
  let header;
  let body;
  let bottomMostSubVar;
  if (location.pathname.startsWith('/r/')) {
    const parts = lib.qsa(selectors.createSubPartsSelector());
    header = parts[0];
    body = parts[1];
    bottomMostSubVar = parts[2];
  } else {
    const container = lib.chainFistChildElemOf(
      lib.qs(selectors.ReditContainerSelector),
      3
    );
    for (let i = 0; i < container.children.length; i++) {
      const child = container.children[i];
      if (child instanceof HTMLDivElement) {
        if (header == null) header = child;
        else if (body == null) body = child;
        else if (bottomMostSubVar == null) bottomMostSubVar = child;
      }
    }
  }
  // loader > div > div > div.Post
  const postList = lib.getNthParentElement(lib.qs(selectors.APost, body), 3);
  return {
    header,
    body,
    postList,
    bottomMostSubVar,
  };
}

/**
 *
 * @param {?Element} postContainer
 * @return {boolean}
 */
export function isNotPromotedOrAddPost(postContainer) {
  const maybePromotedSpan = lib.qs(selectors.MaybePromotedSpan, postContainer);
  if (maybePromotedSpan) {
    const promoted = lib.elementTextContains(
      maybePromotedSpan,
      'promoted',
      true
    );
    if (promoted) lib.scrollIntoView(postContainer);
    return !promoted;
  }
  return true;
}

/**
 * @param {Element} postContainer
 * @return {?Element}
 */
export function selectPost(postContainer) {
  return lib.qs(selectors.APost, postContainer);
}

/**
 * @param {Element} postContainer
 * @return {{postContainer: Element, post: Element}}
 */
export function selectPostWithContainer(postContainer) {
  return {
    postContainer,
    post: lib.qs(selectors.APost, postContainer),
  };
}

/**
 *
 * @param {Element} bottomMostSubVar
 * @return {?Element}
 */
export function findPostViewer(bottomMostSubVar) {
  if (bottomMostSubVar.hasChildNodes()) {
    return bottomMostSubVar;
  }
  return lib.getNthPreviousElementSibling(bottomMostSubVar, 2);
}

export async function* loadAllComments() {
  const commentLoader = lib.chainFistChildElemOf(
    lib.lastChildElementOf(
      lib.chainFistChildElemOf(
        lib.id(selectors.ViewedPostOverlayScrollContainerId),
        3
      )
    ),
    3
  );
  yield lib.stateWithMsgNoWait('Loading comments');
  let currentMoreComments = lib.qsa(
    selectors.MoreCommentsDivP,
    commentLoader
  );
  while (currentMoreComments.length) {
    for (let i = 0; i < currentMoreComments.length; i++) {
      await lib.scrollIntoViewAndClickWithDelay(currentMoreComments[i]);
    }
    yield lib.stateWithMsgWait(
      `Clicked ${currentMoreComments.length} load more comments elements`
    );
    currentMoreComments = lib.qsa(
      selectors.MoreCommentsDivP,
      commentLoader
    );
  }
  yield lib.stateWithMsgNoWait('Loaded all comments');
}

/**
 * @typedef {Object} SubStructure
 * @property {Element} header
 * @property {Element} body
 * @property {Element} postList
 * @property {Element} bottomMostSubVar
 */
