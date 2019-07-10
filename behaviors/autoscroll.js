import * as lib from '../lib';

export default async function* autoScrollBehavior() {
  yield lib.stateWithMsgNoWait('Beginning scroll');
  const maxScroll = 50;
  const scroller = lib.createScroller();
  await lib.domCompletePromise();
  lib.collectOutlinksFromDoc();
  lib.autoFetchFromDoc();
  while (scroller.canScrollDownMore()) {
    let localTimesScrolled = 0;
    while (scroller.canScrollDownMore() && localTimesScrolled < maxScroll) {
      scroller.scrollDown();
      if (await lib.findAllMediaElementsAndPlay()) {
        yield lib.createState(true, 'Played some media');
      }
      localTimesScrolled += 1;
      lib.autoFetchFromDoc();
      // ensure we do not go way way to fast in order to allow
      // time for additional content to be loaded
      await lib.delay(500);
    }
    lib.autoFetchFromDoc();
    lib.collectOutlinksFromDoc();
    yield lib.stateWithMsgWait('Waiting for network idle');
  }
}

export const metaData = {
  name: 'autoScrollBehavior',
  defaultBehavior: true,
  description:
    'Automatically scroll down the page and capture any embedded content. If more content loads, scrolling will continue until autopilot is stopped by user.',
};

export const isBehavior = true;
