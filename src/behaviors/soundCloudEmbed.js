(function (xpg, debug = false) {
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
    soundListItem: '//li[contains(@class, "soundsList__item") and not(contains(@class, "wrvistited"))]'
  };

  const selectors = {
    soundItem: 'div.soundItem',
    singleTrackEmbedPlay: 'button[role="application"].playButton'
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

  function playTrack(elem, clickableSelector) {
    let theClickable = elem.querySelector(clickableSelector);
    if (theClickable == null)
      return false;
    theClickable.click();
    return true;
  }

  function isMultiTrackEmbed(xpg) {
    return xpg(xpQueries.soundListItem).length > 0;
  }

  async function* playMultiTracks(xpg) {
    let snapShot = xpg(xpQueries.soundListItem);
    let soundItem;
    let i, len;
    if (snapShot.length === 0)
      return;
    do {
      len = snapShot.length;
      i = 0;
      for (; i < len; ++i) {
        soundItem = snapShot[i];
        soundItem.classList.add('wrvistited');
        await scrollIntoView(soundItem);
        yield playTrack(soundItem, selectors.soundItem);
      }
      snapShot = xpg(xpQueries.soundListItem);
      if (snapShot.length === 0) {
        await delay();
        snapShot = xpg(xpQueries.soundListItem);
      }
    } while (snapShot.length > 0);
  }

  async function* embedTrackIterator(xpg) {
    if (isMultiTrackEmbed(xpg)) {
      yield* playMultiTracks(xpg);
    } else {
      yield playTrack(document, selectors.singleTrackEmbedPlay);
    }
  }

  window.$WRIterator$ = embedTrackIterator(xpg);
  window.$WRIteratorHandler$ = async function () {
    const results = await $WRIterator$.next();
    return {done: results.done, wait: results.value};
  };
})($x);
