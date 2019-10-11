import * as lib from '../lib';

// special actions for ensuring that embeds are played
const specialActions = [
  {
    rx: /w\.soundcloud\.com/,
    check(url) {
      if (url.href.search(this.rx) >= 0) {
        const autoplay = url.searchParams.get('auto_play');
        return autoplay !== 'true';
      }
      return false;
    },
    handle(iframe, url) {
      url.searchParams.set('auto_play', 'true');
      url.searchParams.set('continuous_play', 'true');
      iframe.src = url.href;
    },
  },
  {
    rx: [/player\.vimeo\.com/, /youtube\.com\/embed\//],
    check(url) {
      for (let i = 0; i < this.rx.length; i++) {
        if (url.href.search(this.rx[i]) >= 0) {
          const autoplay = url.searchParams.get('autoplay');
          return autoplay !== '1';
        }
      }
      return false;
    },
    handle(iframe, url) {
      url.searchParams.set('autoplay', '1');
      iframe.src = url.href;
    },
  },
];

function checkForIframeEmbeds() {
  const iframes = document.getElementsByTagName('IFRAME');
  for (let i = 0; i < iframes.length; i++) {
    const iframeSrc = iframes[i].src;
    if (iframeSrc) {
      try {
        const srcURL = new URL(iframeSrc);
        for (let j = 0; j < specialActions.length; j++) {
          const specialAction = specialActions[j];
          if (specialAction.check(srcURL)) {
            specialAction.handle(iframes[i], srcURL);
            break;
          }
        }
      } catch (e) {}
    }
  }
}

export default async function* autoScrollBehavior(init) {
  const state = { timesScrolled: 0, timesWaited: 0 };
  if (init && typeof init.fallbackMsg === 'string') {
    // for when we fall back to this behavior
    yield lib.stateWithMsgNoWait(init.fallbackMsg, state);
  } else {
    yield lib.stateWithMsgNoWait('Beginning scroll', state);
  }
  const maxScroll = 50;
  await lib.domCompletePromise();
  const scroller = lib.createScroller();
  lib.autoFetchFromDoc();
  lib.collectOutlinksFromDoc();
  while (scroller.canScrollDownMore()) {
    let localTimesScrolled = 0;
    while (scroller.canScrollDownMore() && localTimesScrolled < maxScroll) {
      scroller.scrollDown();
      state.timesScrolled++;
      if (await lib.findAllMediaElementsAndPlay()) {
        yield lib.stateWithMsgWait('Auto scroll played some media', state);
      }
      if (localTimesScrolled % 5 === 0) checkForIframeEmbeds();
      localTimesScrolled++;
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
  checkForIframeEmbeds();
  return lib.stateWithMsgNoWait('Auto scroll finished', state);
}

export const metadata = {
  name: 'autoScrollBehavior',
  displayName: 'Default Scrolling',
  defaultBehavior: true,
  description:
    'Default behavior for any page. Automatically scrolls down the page as much as possible. If additional content loads that increases page height, scrolling will continue until autopilot is stopped by user. Any discovered audio/video is played, but no other interactions are performed.',
  updated: '2019-08-21T14:52:23-07:00',
};

export const isBehavior = true;
