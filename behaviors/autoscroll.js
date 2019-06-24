import * as lib from '../lib';

const maxScroll = 100;
const scroller = lib.createScroller();

export async function* scroll() {
  let localTimesScrolled = 0;
  while (scroller.canScrollMoreUpDown() && localTimesScrolled < maxScroll) {
    lib.collectOutlinksFromDoc();
    scroller.scrollDown();
    yield lib.stateWithMsgWaitFromAwaitable(
      lib.findAllMediaElementsAndPlay(),
      `Scrolled page ${scroller.scrollCountDown} times`
    );
    localTimesScrolled += 1;
  }
  yield lib.stateWithMsgWait('Waiting for network idle');
}

export default async function* autoScrollBehavior() {
  yield lib.stateWithMsgNoWait('Beginning scroll');
  await lib.domCompletePromise();
  lib.collectOutlinksFromDoc();
  while (scroller.canScrollMoreUpDown()) {
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
