import * as lib from '../lib';

let timesScrolled = 0;
const maxScroll = 100;

export async function* scroll() {
  let scrollCount = 0;
  while (lib.canScrollMore() && scrollCount < maxScroll) {
    scrollCount++;
    timesScrolled++;
    lib.collectOutlinksFromDoc();
    lib.scrollWindowDownBy(500);
    yield lib.stateWithMsgWaitFromAwaitable(
      lib.findAllMediaElementsAndPlay(),
      `Scrolled page ${timesScrolled} times`
    );
  }
  yield lib.stateWithMsgWait('Waiting for network idle');
}

export default async function* autoScrollBehavior() {
  yield lib.composeAsync(
    lib.partial(lib.stateWithMsgNoWait, 'Beginning scroll'),
    lib.domCompletePromise
  )();
  lib.collectOutlinksFromDoc();
  while (lib.canScrollMore()) {
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
