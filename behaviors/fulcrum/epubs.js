import * as lib from '../../lib';
import * as selectors from './selectors';

async function waitForReaderToBeVisible() {
  const epubView = await lib.waitForAndSelectElement(
    document,
    selectors.EpubView
  );
  if (!lib.isElemVisible(epubView)) {
    await lib.waitForElementToBecomeVisible(epubView);
  }

  await lib.waitForPredicate(() => lib.selectorExists(selectors.EpubNextPage));
}

/**
 * Checks the currently rendered iframe for media embeds
 * @return {AsyncGenerator<{wait: boolean, msg: string, state: *}, *>}
 */
async function* checkEpubViewerForMedia() {
  yield lib.stateWithMsgWait('Checking for embeds');
  const viewer = lib.firstChildElementOfSelector(selectors.EpubView);
  const displayedDoc = viewer.contentDocument;
  const embeds = lib.qsa('iframe[src*="embed"]', displayedDoc);
  for (let i = 0; i < embeds.length; i++) {
    const embed = embeds[i];
    const vidAudios = lib.qsa('video, audio', embed.contentDocument);
    for (let j = 0; j < vidAudios.length; j++) {
      yield lib.stateWithMsgNoWait('playing video or audio');
      await lib.noExceptPlayMediaElement(vidAudios[j]);
    }
  }
}

/**
 * Initiates the transition to the next part of the epub
 * @return {Promise<{next: Object, rendered: boolean}>}
 */
async function nextPage() {
  const prr = lib.promiseResolveReject();
  let rendered = false;
  const renderedListener = () => {
    rendered = true;
  };
  // the rendition tells us if the iframe displaying
  // the current part(s) of the the epub was swapped out
  reader._rendition.once('rendered', renderedListener);
  // we have relocated once the next part is displayed
  reader.once('relocated', next => {
    reader._rendition.off('rendered', renderedListener);
    prr.resolve({ next, rendered });
  });
  reader.next();
  return prr.promise;
}

export default async function* behavior(cliAPI) {
  await waitForReaderToBeVisible();
  yield* checkEpubViewerForMedia();
  while (1) {
    const result = await nextPage();
    if (result.next.atEnd) {
      break;
    }
    // the epub part(s) are rendered in an iframe once
    // all elements are alive and each part is displayed
    // changing the containers scroll property
    if (result.rendered) {
      yield* checkEpubViewerForMedia();
    } else {
      yield lib.stateWithMsgNoWait('not done');
    }
    await lib.delay(1500);
  }
  yield lib.stateWithMsgNoWait('done');
}

export const isBehavior = true;

export const metadata = {
  name: 'fulcrumEpubBehavior',
  displayName: 'Fulcrum Epub',
  match: {
    regex: /https?:\/\/(www\.)?fulcrum\.org\/epubs\/.+/,
  },
  description: '',
};
