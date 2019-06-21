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
    'Scrolls the page until we can scroll no more. If media elements are discovered while scrolling they are played',
};

export const isBehavior = true;
