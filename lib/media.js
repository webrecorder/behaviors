import { qs, qsa, id } from './dom';
import { uuidv4 } from './general';

/**
 * @desc Calls the play method of the element returned by the querySelector
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
 * @desc Calls the play method of the element returned by calling document.getElementById
 * @param {string} eid - The id of the media element
 * @param {Document} [cntx] - Optional document object to use
 * @return {Promise<boolean>} - Returns false if an exception occurred or true if playing was successful
 */
export function selectIdAndPlay(eid, cntx) {
  const elem = id(eid, cntx);
  return noExceptPlayMediaElement(elem);
}

/**
 * @desc Calls the play function of the supplied element catching the exception thrown
 * if any was thrown. Returns true indicating call to play was successful otherwise false
 * @param {HTMLMediaElement} mediaElement
 * @return {Promise<boolean>} - Returns false if an exception occurred or true if playing was successful
 */
export async function noExceptPlayMediaElement(mediaElement) {
  if (mediaElement == null || typeof mediaElement.play !== 'function') {
    return false;
  }
  try {
    await mediaElement.play();
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * @type {string}
 * @private
 */
const __MediaElementSelector__ = 'audio, video';
let __Played__;

/**
 * @desc Calls the play function on all audio and video elements found in the document.
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
    if (!mediaElems[i][__Played__]) {
      proms.push(noExceptPlayMediaElement(mediaElems[i]));
      Object.defineProperty(mediaElems[i], __Played__, {
        value: true,
        enumerable: false,
      });
      mediaElems[i][__Played__] = true;
      shouldWait = true;
    }
  }
  await Promise.all(proms);
  return shouldWait;
}
