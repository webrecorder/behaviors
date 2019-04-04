import { qs, qsa, id } from './dom';

/**
 * @desc Calls the play method of the element returned by the querySelector
 * @param {string} selector - The query selector to select a media element
 * @param {Document|Element} [cntx] - Optional element/Document to use
 * to perform the querySelector call from
 */
export async function selectAndPlay(selector, cntx) {
  const elem = qs(selector, cntx);
  if (elem && elem.paused) {
    await noExceptPlayMediaElement(elem);
  }
}

/**
 * @desc Calls the play method of the element returned by calling document.getElementById
 * @param {string} eid - The id of the media element
 * @param {Document} [cntx] - Optional document object to use
 */
export async function selectIdAndPlay(eid, cntx) {
  const elem = id(eid, cntx);
  if (elem && elem.paused) {
    await noExceptPlayMediaElement(elem);
  }
}

/**
 * @desc Calls the play function of the supplied element catching the exception thrown
 * if any was thrown. Returns true indicating call to play was successful otherwise false
 * @param {HTMLMediaElement} mediaElement
 * @return {Promise<boolean>} - Returns false if an exception occurred or true if playing was sucessful
 */
export async function noExceptPlayMediaElement(mediaElement) {
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
const __MediaElementSelector = 'audio, video';

/**
 * @desc Calls the play function on all audio and video elements found in the document.
 * If context is supplied, the selection of audio and video elements is done from
 * the supplied context.
 * @param {Document|Element} [cntx] - Optional element to use rather
 * than the current JS context's document object
 * @return {Promise<boolean>}
 */
export async function findAllMediaElementsAndPlay(cntx) {
  const mediaElems = qsa(__MediaElementSelector, cntx);
  let shouldWait = false;
  for (var i = 0; i < mediaElems.length; i++) {
    if (mediaElems[i].paused && !mediaElems[i].$$$$__PLAYED__$$$$) {
      await noExceptPlayMediaElement(mediaElems[i]);
      mediaElems[i].$$$$__PLAYED__$$$$ = true;
      shouldWait = true;
    }
  }
  return shouldWait;
}
