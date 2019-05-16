import * as lib from '../lib';

let timesScrolled = 0;
const maxScroll = 100;

async function* scroll() {
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
    'Scrolls the page until we can scroll no more. If media elements are discovered while scrolling they are played',
};

export const isBehavior = true;
