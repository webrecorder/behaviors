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

async function* checkEpubViewerForMedia() {
  yield lib.stateWithMsgWait('Checking for embeds');
  const viewer = lib.firstChildElementOfSelector(selectors.EpubView);
  const embeds = lib.qsa('iframe[src*="embed"]', viewer.contentDocument);
  for (let i = 0; i < embeds.length; i++) {
    const embed = embeds[i];
    console.log(embed);
    const videos = lib.qsa('video', embed.contentDocument);
    for (let j = 0; j < videos.length; j++) {
      const video = videos[j];
      console.log(video);
      yield lib.stateWithMsgNoWait('playing video');
      await lib.noExceptPlayMediaElement(video);
    }
  }
}

async function nextPage() {
  const prr = lib.promiseResolveReject();
  reader.once('relocated', value => {
    prr.resolve(value);
  });
  reader.next();
  return prr.promise;
}
export default async function* behavior(cliAPI) {
  await waitForReaderToBeVisible();
  while (1) {
    const v = await nextPage();
    yield* checkEpubViewerForMedia();
    if (v.atEnd) {
      break;
    } else {
      yield lib.stateWithMsgNoWait('not done');
    }
    await lib.delay();
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
