import { domCompletePromise } from '../utils/delays';
import { findAllMediaAndPlay } from '../utils/general';
import {collectOutlinksFrom} from '../utils/outlinkCollector';

/*!return!*/ domCompletePromise().then(() => {
  let scrollingTO = 2000;
  let lastScrolled = Date.now();
  let maxScroll = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );
  let scrollCount = 0;
  return new Promise((resolve, reject) => {
    let scrollerInterval = setInterval(() => {
      let scrollPos = window.scrollY + window.innerHeight;
      if (scrollCount < 50) {
        maxScroll = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        );
        scrollCount += 1;
      }
      if (scrollPos < maxScroll) {
        window.scrollBy(0, 300);
        lastScrolled = Date.now();
      }
      collectOutlinksFrom(document);
      findAllMediaAndPlay();
      if (!lastScrolled || Date.now() - lastScrolled > scrollingTO) {
        if (scrollerInterval === undefined) {
          return;
        }
        clearInterval(scrollerInterval);
        scrollerInterval = undefined;
        resolve();
      } else if (scrollPos >= maxScroll) {
        clearInterval(scrollerInterval);
        scrollerInterval = undefined;
        resolve();
      }
    }, 500);
  })
});
