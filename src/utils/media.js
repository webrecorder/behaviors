
/**
 * @param {string} selector
 * @param {Document | Element} [cntx]
 */
export async function selectAndPlay(selector, cntx) {
  const elem = (cntx || document).querySelector(selector);
  if (elem && elem.paused) {
    await elem.play();
  }
}

/**
 * @param {string} selector
 * @param {Document} [cntx]
 */
export async function selectIdAndPlay(selector, cntx) {
  const elem = (cntx || document).getElementById(selector);
  if (elem && elem.paused) {
    await elem.play();
  }
}