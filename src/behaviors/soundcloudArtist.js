(function(xpg, debug = false) {
  if (debug && document.getElementById('$wrStyle$') == null) {
    const style = document.createElement('style');
    style.id = '$wrStyle$';
    style.innerText = '.wr-debug-visited {border: 6px solid #3232F1;} ';
    document.head.appendChild(style);
  }

  if (
    typeof xpg !== 'function' ||
    xpg.toString().indexOf('[Command Line API]') === -1
  ) {
    /**
     * @desc Polyfill console api $x
     * @param {string} xpathQuery
     * @param {Element | Document} startElem
     * @return {Array<HTMLElement>}
     */
    xpg = function (xpathQuery, startElem) {
      if (startElem == null) {
        startElem = document;
      }
      const snapShot = document.evaluate(
        xpathQuery,
        startElem,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      const elements = [];
      let i = 0;
      let len = snapShot.snapshotLength;
      while (i < len) {
        elements.push(snapShot.snapshotItem(i));
        i += 1;
      }
      return elements;
    };
  }

  const xpQueries = {
    soundItem:
      '//div[@class="userStreamItem" and not(contains(@class, "wrvistited"))]'
  };

  const selectors = {
    loadMoreTracks: 'a.compactTrackList__moreLink',
    playSingleTrack: 'a.playButton',
    multiTrackItem: 'li.compactTrackList__item',
    playMultiTrackTrack: 'div.compactTrackListItem.clickToPlay'
  };

  function scrollIntoView(elem, delayTime = 1000) {
    elem.scrollIntoView({
      behavior: 'auto',
      block: 'center',
      inline: 'center'
    });
    return new Promise(r => setTimeout(r, delayTime));
  }

  function delay(delayTime = 3000) {
    return new Promise(r => setTimeout(r, delayTime));
  }

  function needToLoadMoreTracks(elem) {
    return elem.querySelector(selectors.loadMoreTracks) != null;
  }

  function loadMoreTracks(elem) {
    elem.querySelector(selectors.loadMoreTracks).click();
    return delay(1500);
  }

  function playTrack(elem, clickableSelector) {
    let theClickable = elem.querySelector(clickableSelector);
    if (theClickable == null) return false;
    theClickable.click();
    return true;
  }

  async function* playMultipleTracks(elem) {
    const tracks = elem.querySelectorAll(selectors.multiTrackItem);
    let i = 0;
    let len = tracks.length;
    if (len === 0) {
      yield false;
      return;
    }
    let playable;
    for (; i < len; ++i) {
      playable = tracks[i];
      playable.classList.add('wrvistited');
      if (debug) playable.classList.add('wr-debug-visited');
      await scrollIntoView(playable);
      yield playTrack(playable, selectors.playMultiTrackTrack);
    }
  }

  async function* vistSoundItems(xpg) {
    let snapShot = xpg(xpQueries.soundItem);
    let soundItem;
    let i, len;
    if (snapShot.length === 0) return;
    do {
      len = snapShot.length;
      i = 0;
      for (; i < len; ++i) {
        soundItem = snapShot[i];
        soundItem.classList.add('wrvistited');
        if (debug) soundItem.classList.add('wr-debug-visited');
        await scrollIntoView(soundItem);
        if (needToLoadMoreTracks(soundItem)) {
          await loadMoreTracks(soundItem);
          yield* playMultipleTracks(soundItem);
        } else {
          yield playTrack(soundItem, selectors.playSingleTrack);
        }
      }
      snapShot = xpg(xpQueries.soundItem);
      if (snapShot.length === 0) {
        await delay();
        snapShot = xpg(xpQueries.soundItem);
      }
    } while (snapShot.length > 0);
  }

  window.$WRIterator$ = vistSoundItems(xpg);
  window.$WRIteratorHandler$ = async function() {
    const results = await $WRIterator$.next();
    return { done: results.done, wait: results.value };
  };
})($x);
