import * as lib from '../lib';

export default async function* autoScrollBehavior(init) {
  const state = { timesScrolled: 0, timesWaited: 0 };
  if (init && typeof init.fallbackMsg === 'string') {
    // for when we fall back to this behavior
    yield lib.stateWithMsgNoWait(init.fallbackMsg, state);
  } else {
    yield lib.stateWithMsgNoWait('Beginning scroll', state);
  }
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
        yield lib.stateWithMsgWait('Auto scroll played some media', state);
      }
      localTimesScrolled += 1;
      state.timesScrolled += localTimesScrolled;
      lib.autoFetchFromDoc();
      // ensure we do not go way way to fast in order to allow
      // time for additional content to be loaded
      await lib.delay(500);
    }
    lib.autoFetchFromDoc();
    lib.collectOutlinksFromDoc();
    state.timesWaited += 1;
    yield lib.stateWithMsgWait('Auto scroll waiting for network idle', state);
  }
  return lib.stateWithMsgNoWait('Auto scroll finished', state);
}

export const metadata = {
  name: 'autoScrollBehavior',
  defaultBehavior: true,
  description:
    'Automatically scroll down the page and capture any embedded content. If more content loads, scrolling will continue until autopilot is stopped by user.',
  updated: '2019-07-24T20:14:43-04:00',
};

export const isBehavior = true;
