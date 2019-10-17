import { id, qs, qsa } from './dom';
import { uuidv4 } from './general';

/**
 * Calls the play method of the element returned by the querySelector
 * @param {string} selector - The query selector to select a media element
 * @param {Document|Element} [cntx] - Optional element/Document to use
 * to perform the querySelector call from
 * @return {Promise<boolean>} - Returns false if an exception occurred or true if playing was successful
 */
export function selectAndPlay(selector, cntx) {
  const elem = qs(selector, cntx);
  return noExceptPlayMediaElement(elem);
}

/**
 * Calls the play method of the element returned by calling document.getElementById
 * @param {string} eid - The id of the media element
 * @param {Document} [cntx] - Optional document object to use
 * @return {Promise<boolean>} - Returns false if an exception occurred or true if playing was successful
 */
export function selectIdAndPlay(eid, cntx) {
  const elem = id(eid, cntx);
  return noExceptPlayMediaElement(elem);
}

/**
 * Attempts to set the playback rate of the supplied media element
 * to the supplied rate if it was supplied otherwise defaults to 16x.
 *
 * If the setting the playback rate fails the rate is subtracted by 0.25
 * until a valid rate is found or the rate returns to 1.
 * In the case when a non-suitable playback rate is found the original
 * playback rate is re-set.
 * @param {HTMLMediaElement} mediaElem - The media element who's playback rate
 * is to be changed
 * @param {number} [rate] - Optional playback rate, defaults to 16
 */
export function setMediaElemPlaybackRate(mediaElem, rate) {
  if (!mediaElem) return;
  const originalPlaybackRate = mediaElem.playbackRate;
  let good = false;
  let mediaRate = 16.0;
  if (rate && typeof rate === 'number') {
    // if rate is not greater than 1 just use default rate
    mediaRate = rate > 1 ? rate : mediaRate;
  }
  for (; mediaRate > 1.0; mediaRate -= 0.25) {
    // a exception is thrown if the media element does not support
    // the new playback rate
    try {
      mediaElem.playbackRate = mediaRate;
      good = true;
      break;
    } catch (e) {}
  }
  if (!good) {
    mediaElem.playbackRate =
      originalPlaybackRate > 0 ? originalPlaybackRate : 1;
  }
}

/**
 * Calls the play function of the supplied element catching the exception thrown
 * if any was thrown. Returns true indicating call to play was successful otherwise false
 * @param {HTMLMediaElement} mediaElement - The media element to be played
 * @param {boolean} [playThrough] - Should the can play through event be waited for
 * @return {Promise<boolean>} - Returns false if an exception occurred or true if playing was successful
 */
export async function noExceptPlayMediaElement(mediaElement, playThrough) {
  if (mediaElement == null || typeof mediaElement.play !== 'function') {
    return false;
  }
  try {
    let playProm;
    if (playThrough) {
      const plp = uaThinksMediaElementCanPlayAllTheWay(mediaElement);
      playProm = Promise.all([mediaElement.play(), plp]);
    } else {
      playProm = mediaElement.play();
    }
    await playProm;
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * Returns a promise that resolves once the canplaythrough or error event
 * is fired from the supplied media element
 * @param {HTMLMediaElement} mediaElement
 * @return {Promise<void>}
 */
export function uaThinksMediaElementCanPlayAllTheWay(mediaElement) {
  return new Promise(resolve => {
    let to;
    const listener = () => {
      if (to != null) {
        clearTimeout(to);
        to = null;
      }
      mediaElement.removeEventListener('canplaythrough', listener);
      mediaElement.removeEventListener('error', listener);
      resolve();
    };
    mediaElement.addEventListener('canplaythrough', listener);
    mediaElement.addEventListener('error', listener);
    to = setTimeout(listener, 60000);
  });
}

/**
 * @type {string}
 * @private
 */
const __MediaElementSelector__ = 'audio, video';
/** @ignore  */
let __Played__;

/**
 * Calls the play function on all audio and video elements found in the document.
 * If context is supplied, the selection of audio and video elements is done from
 * the supplied context.
 * @param {Document|Element} [cntx] - Optional element to use rather
 * than the current JS context's document object
 * @return {Promise<boolean>}
 */
export async function findAllMediaElementsAndPlay(cntx) {
  if (__Played__ == null) __Played__ = Symbol(uuidv4());
  const mediaElems = qsa(__MediaElementSelector__, cntx);
  if (mediaElems.length === 0) return false;
  const proms = [];
  let shouldWait = false;
  for (var i = 0; i < mediaElems.length; i++) {
    const mediaElem = mediaElems[i];
    if (!mediaElem[__Played__]) {
      setMediaElemPlaybackRate(mediaElem, 10.0);
      proms.push(noExceptPlayMediaElement(mediaElem));
      Object.defineProperty(mediaElem, __Played__, {
        value: true,
        enumerable: false,
      });
      shouldWait = true;
    }
  }
  if (proms.length) {
    await Promise.all(proms);
  }
  return shouldWait;
}
