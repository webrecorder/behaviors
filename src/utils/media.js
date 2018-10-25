import { qs, id } from './dom';

/**
 * @param {string} selector
 * @param {Document | Element} [cntx]
 */
export async function selectAndPlay(selector, cntx) {
  const elem = qs(selector, cntx);
  if (elem && elem.paused) {
    await elem.play();
  }
}

/**
 * @param {string} selector
 * @param {Document} [cntx]
 */
export async function selectIdAndPlay(selector, cntx) {
  const elem = id(selector, cntx);
  if (elem && elem.paused) {
    await elem.play();
  }
}