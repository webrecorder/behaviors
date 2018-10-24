import { canAcessIf } from '../utils/dom';
import { clickWithDelay } from '../utils/clicks';
import { autoFetchTheseURLS } from '../utils/general';

const selectors = {
  iframeLoader: 'iframe.ssIframeLoader',
  nextSlide: 'btnNext',
  slideContainer: 'div.slide_container',
  showingSlide: 'div.slide.show',
  slideImg: 'img.slide_image'
};

/**
 * @param {Document | Element} doc
 * @return {number}
 */
function getNumSlides(doc) {
  const slideContainer = doc.querySelector(selectors.slideContainer);
  if (slideContainer) {
    return slideContainer.childElementCount;
  }
  return -1;
}

function fetchSlidesVariableImg(doc) {
  const imgs = doc.querySelectorAll(selectors.slideImg);
  const len = imgs.length;
  const toFetch = [];
  let i = 0;
  let imgDset;
  for(; i < len; ++i) {
    imgDset = imgs[i].dataset;
    if (imgDset) {
      toFetch.push(imgDset.full);
      toFetch.push(imgDset.normal);
      toFetch.push(imgDset.small);
    }
  }
  autoFetchTheseURLS(toFetch);
}


/**
 * @param {Document | Element} doc
 * @return {AsyncIterableIterator<*>}
 */
async function* consumeSlides(doc) {
  // add 1 to total to get end slide overlay
  const numSlides = getNumSlides(doc) + 1;
  console.log(`there are ${numSlides - 1}`);
  fetchSlidesVariableImg(doc);
  let i = 1;
  for(; i < numSlides; ++i) {
    await clickWithDelay(doc.getElementById(selectors.nextSlide));
    yield doc.querySelector(selectors.showingSlide);
  }
}

/**
 * @param {HTMLIFrameElement} iframe
 * @return {Promise<void>}
 */
async function doSlideShow(iframe) {
  const slideDoc = iframe.contentDocument;
  for await (const it of consumeSlides(slideDoc)) {
    console.log(it)
  }
}

let slideIframe = document.querySelector(selectors.iframeLoader);
if (canAcessIf(slideIframe)) {
  doSlideShow(slideIframe).catch(error => console.error(error))
}
