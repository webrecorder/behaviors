import * as lib from '../../lib';
import * as selectors from './selectors';

/**
 * Creates and returns an object containing the element to be used to view the message,
 * the title of the message viewed, and a function for refinding the viewed message
 * in the message list
 * @param {SomeElement} messageRow - The current message row
 * @return {{whichMsg: string, view: SomeElement, refind: function(parentElement: SomeElement): ?SomeElement}}
 */
function messageInfo(messageRow) {
  const messageTitle = lib.qs(selectors.ViewMessageTitle, messageRow);
  const view = lib.qs('a', messageTitle);
  // we need to be more verbose for our refind selector
  const refindSelector = `${selectors.BaseRefindMessage} > a[href*="${lib.attr(
    view,
    'href'
  )}"]`;
  const title = lib.attr(view, 'title');
  const msgId = (
    lib.innerTextOfSelected(selectors.MessageIdContainer, messageRow) || ''
  ).trim();
  return {
    refind(parentElem) {
      // the message row is the third parent of the a tag used to view
      // the actual message
      const newView = lib.qs(refindSelector, parentElem);
      return lib.getNthParentElement(newView, 3);
    },
    whichMsg: msgId ? `${title} (${msgId})` : title,
    view,
  };
}

/**
 * Returns T/F indicating if the viewed attachment image is loading
 * @return {boolean}
 */
function attachmentImgIsLoading() {
  const img = lib.id(selectors.MessageAttachmentImageViewerId);
  const computedStyle = window.getComputedStyle(img);
  // the background of the image will have the cover-loader gif if it is loading
  // otherwise check for the T/F returned by the complete property of image tags
  return computedStyle.background.includes('cover-loader.gif') || !img.complete;
}

/**
 * Returns T/F indicating if the supplied attachment element is an image
 * @param {SomeElement} attachment - The attachment to be checked
 * @return {boolean}
 */
function isAttachmentImage(attachment) {
  return lib.elemMatchesSelector(
    lib.firstChildElementOf(attachment),
    selectors.MessageAttachmentImage
  );
}

/**
 * Attempts to remove any annoying elements such as popups before the
 * behavior starts
 */
function ensureNoAnnoyingElements() {
  lib.maybeRemoveElemById(selectors.AnnoyingUpsellContainerId);
}

/**
 * Simple predicate for determining if the viewed attachment image
 * is no longer loading
 * @return {boolean}
 */
const attachmentImgIsNoLongerLoading = () => !attachmentImgIsLoading();

/**
 * Simple predicate checking if the attachment image viewer is visible
 * @return {boolean}
 */
const isImageViewerVisible = () =>
  lib.isElemVisible(lib.qs(selectors.CloseViewedMessageAttachment));

const MaxPredicateWait = {
  max: lib.secondsToDelayAmount(6),
};

/**
 * Clicks the supplied to be clicked element with delay afterwards
 * checks if the page loading indicator is visible. If the page
 * loading indicator is visible a wait is performed until it is no
 * longer visible
 * @param {?SomeElement} toBeClicked - The element to be clicked
 * @return {Promise<void>}
 */
async function clickAndCheckLoading(toBeClicked) {
  await lib.clickWithDelay(toBeClicked);
  const pageLoadingIndicator = lib.qs(selectors.PageLoader);
  if (lib.isElemVisible(pageLoadingIndicator)) {
    await lib.waitForElementToBecomeInvisible(pageLoadingIndicator);
  }
}

/**
 * Attempts to click the previous and next message buttons (for viewing
 * a message inline)
 * @return {Promise<void>}
 */
async function ensureNextPreviousMsgWorks() {
  const previous = lib.qs(selectors.ViewPreviousMessageInlineButton);
  if (previous) {
    await clickAndCheckLoading(previous.parentElement);
  }
  const next = lib.qs(selectors.ViewNextMessageInlineButton);
  if (next) {
    await clickAndCheckLoading(next.parentElement);
  }
}

export default async function* yahooGroupConvoMessagesBehavior() {
  const state = { messages: 0 };
  await lib.domCompletePromise();
  ensureNoAnnoyingElements();
  let childRefinder;
  const walker = new lib.DisconnectingWalk({
    loader: true,
    findParent: () => lib.qs(selectors.MessageListGrid),
    refindChild: (parent, child) => childRefinder(parent),
    wait: (parent, child) => lib.waitForAdditionalElemChildren(parent),
  });
  let didFirstMessageLoad = false;
  for await (const messageRow of walker.walk()) {
    // if this row in the message list is not a message, skip it
    // there is an invisible h1 that is the first child of the message list
    // as well as ads ....
    if (!lib.elemMatchesSelector(messageRow, selectors.MessageRow)) {
      continue;
    }
    const { view, refind, whichMsg } = messageInfo(messageRow);
    if (!didFirstMessageLoad) {
      yield lib.stateWithMsgNoWait(
        'Ensuring messages can be viewed individually',
        state
      );
      await lib.loadPageViaIframe(view.href);
      didFirstMessageLoad = true;
    }
    childRefinder = refind;
    state.messages++;
    await lib.scrollIntoViewWithDelay(messageRow);
    yield lib.stateWithMsgNoWait(`Viewing message - ${whichMsg}`, state);
    await clickAndCheckLoading(view);
    // message attachments element always exists even if there are no attachments
    const attachments = lib.qs(selectors.MessageAttachments);
    lib.collectOutlinksFromDoc();
    if (lib.elemHasChildren(attachments)) {
      yield lib.stateWithMsgNoWait(
        "Viewing message's image attachments if any",
        state
      );
      for (const attachment of lib.childElementIterator(attachments)) {
        // only click on image attachments in order to load preview
        const viewAttachment = lib.qs('a', attachment);
        if (isAttachmentImage(attachment)) {
          yield lib.stateWithMsgNoWait('Viewing image attachment', state);
          await lib.clickWithDelay(viewAttachment);
          // wait for the image preview container to be opened
          await lib.waitForPredicate(isImageViewerVisible, MaxPredicateWait);
          if (attachmentImgIsLoading()) {
            yield lib.stateWithMsgNoWait(
              'Waiting for current attachment image to load',
              state
            );
            await lib.waitForPredicate(
              attachmentImgIsNoLongerLoading,
              MaxPredicateWait
            );
          }
        } else {
          yield lib.stateWithMsgNoWait(
            'Encountered non-image attachment',
            state
          );
          lib.sendAutoFetchWorkerURLs([viewAttachment.href]);
        }
        await lib.selectElemAndClickWithDelay(
          selectors.CloseViewedMessageAttachment
        );
      }
    }
    yield lib.stateWithMsgNoWait(
      'Ensuring next previous message buttons work for current message',
      state
    );
    await ensureNextPreviousMsgWorks();
    await clickAndCheckLoading(lib.qs(selectors.ViewingMessageBack));
    yield lib.stateWithMsgNoWait(`Viewed message - ${whichMsg}`, state);
  }
  switch (walker.walkEndedReason) {
    case lib.WalkEndedReasons.failedToFindFirstParent:
      return lib.stateWithMsgNoWait(
        'Failed to find messages root element',
        state
      );
    case lib.WalkEndedReasons.failedToRefindParent:
      return lib.stateWithMsgNoWait(
        'Failed to re-find messages root element',
        state
      );
    case lib.WalkEndedReasons.failedToFindFirstChild:
      return lib.stateWithMsgNoWait('Failed to find a message', state);
    case lib.WalkEndedReasons.failedToRefindChild:
      return lib.stateWithMsgNoWait(
        'Failed to re-find previously viewed message',
        state
      );
    case lib.WalkEndedReasons.noMoreChildren:
      return lib.stateWithMsgNoWait('done', state);
  }
}

export const isBehavior = true;

export const metadata = {
  name: 'yahooGroupConvoMessagesBehavior',
  displayName: 'Yahoo Group Conversation Messages',
  match: {
    regex: /^https?:\/\/(?:www\.)?groups\.yahoo\.com\/neo\/groups\/[^/]+\/conversations\/messages(?:[?].+)?$/,
  },
  description: 'Views conversation messages of a Yahoo Group',
  updated: '2019-10-23T15:04:10-04:00',
};
