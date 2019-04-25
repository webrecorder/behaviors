import * as lib from '../lib';

const maxScroll = 100;
let scrollCount = 0;

export default async function* autoScrollBehavior() {
  await lib.domCompletePromise();
  lib.collectOutlinksFromDoc();
  yield;
  let shouldWait;
  while (lib.canScrollMore() && scrollCount < maxScroll) {
    scrollCount += 1;
    lib.collectOutlinksFromDoc();
    lib.scrollWindowDownBy(300);
    shouldWait = await lib.findAllMediaElementsAndPlay();
    yield shouldWait;
  }
}

export const metaData = {
  name: 'autoScrollBehavior',
  defaultBehavior: true,
  description:
    'Scrolls the page a maximum of 100 times or until we can scroll no more. If media elements are discovered while scrolling they are played'
};

export const isBehavior = true;
