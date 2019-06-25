import * as lib from '../lib';

let timesScrolled = 0;
const maxScroll = 100;
const scroller = lib.createScroller();

export async function* scroll() {
  let localTimesScrolled = 0;
  while (scroller.canScrollDownMore() && localTimesScrolled < maxScroll) {
    scroller.scrollDown();
    timesScrolled += 1;
    yield lib.stateWithMsgWaitFromAwaitable(
      lib.findAllMediaElementsAndPlay(),
      `Scrolled page ${timesScrolled} times`
    );
    localTimesScrolled += 1;
  }
  lib.collectOutlinksFromDoc();
  lib.autoFetchFromDoc();
  yield lib.stateWithMsgWait('Waiting for network idle');
}

export default async function* autoScrollBehavior() {
  yield lib.stateWithMsgNoWait('Beginning scroll');
  await lib.domCompletePromise();
  lib.collectOutlinksFromDoc();
  lib.autoFetchFromDoc();
  while (scroller.canScrollDownMore()) {
    yield* scroll();
  }
}

export const metaData = {
  name: 'autoScrollBehavior',
  defaultBehavior: true,
  description:
    'Automatically scroll down the page and capture any embedded content. If more content loads, scrolling will continue until autopilot is stopped by user.'
};

export const isBehavior = true;
