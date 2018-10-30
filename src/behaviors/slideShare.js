import {
  canAcessIf,
  findTag,
  maybePolyfillXPG,
  qs,
  qsa
} from '../utils/dom';
import { clickInContext, clickInContextWithDelay } from '../utils/clicks';
import { sendAutoFetchWorkerURLs } from '../utils/general';
import {addOutlink} from '../utils/outlinkCollector';

const selectors = {
  iframeLoader: 'iframe.ssIframeLoader',
  nextSlide: 'btnNext',
  slideContainer: 'div.slide_container',
  showingSlide: 'div.slide.show',
  divSlide: 'div.slide',
  sectionSlide: 'section.slide',
  slideImg: 'img.slide_image',
  relatedDecks: 'div.tab.related-tab',
  moreComments: 'a.j-more-comments'
};

const isSlideShelfIF = _if => _if.src.endsWith('/slideshelf');

/**
 * @param {Document | Element} doc
 * @param {string} slideSelector
 * @return {number}
 */
function getNumSlides(doc, slideSelector) {
  const slideContainer = qs(selectors.slideContainer, doc);
  if (slideContainer) {
    return qsa(slideSelector, doc).length;
  }
  return -1;
}

/**
 * @param {Document} doc
 */
function extracAndPreserveSlideImgs(doc) {
  const imgs = qsa(selectors.slideImg, doc);
  const len = imgs.length;
  const toFetch = [];
  let i = 0;
  let imgDset;
  for (; i < len; ++i) {
    imgDset = imgs[i].dataset;
    if (imgDset) {
      toFetch.push(imgDset.full);
      toFetch.push(imgDset.normal);
      toFetch.push(imgDset.small);
    }
  }
  sendAutoFetchWorkerURLs(toFetch);
}

/**
 * @param {Window} win
 * @param {Document} doc
 * @param {string} slideSelector
 * @return {Promise<void>}
 */
async function consumeSlides(win, doc, slideSelector) {
  extracAndPreserveSlideImgs(doc);
  const numSlides = getNumSlides(doc, slideSelector);
  let i = 1;
  for (; i < numSlides; ++i) {
    clickInContext(id(selectors.nextSlide, doc), win);
  }
  await clickInContextWithDelay(id(selectors.nextSlide, doc), win);
}

/**
 * @return {AsyncIterableIterator<*>}
 */
async function* handleSlideDeck() {
  yield await consumeSlides(window, document, selectors.sectionSlide);
}

/**
 * @param {Window} win
 * @param {Document} doc
 * @return {AsyncIterableIterator<*>}
 */
async function* doSlideShowInFrame(win, doc) {
  const decks = qsa('li', qs(selectors.relatedDecks, doc));
  const numDecks = decks.length;
  const deckIF = qs(selectors.iframeLoader, doc);
  yield await consumeSlides(
    deckIF.contentWindow,
    deckIF.contentDocument,
    selectors.divSlide
  );
  let i = 1;
  for (; i < numDecks; ++i) {
    await new Promise(r => {
      const loaded = () => {
        deckIF.removeEventListener('load', loaded);
        r();
      };
      deckIF.addEventListener('load', loaded);
      addOutlink(decks[i].firstElementChild);
      clickInContext(decks[i].firstElementChild, win);
    });
    yield await consumeSlides(
      deckIF.contentWindow,
      deckIF.contentDocument,
      selectors.divSlide
    );
  }
}

/**
 * @return {AsyncIterableIterator<*>}
 */
function init() {
  if (canAcessIf(qs(selectors.iframeLoader))) {
    // 'have iframe loader in top'
    return doSlideShowInFrame(window, document);
  }
  const maybeIF = findTag(maybePolyfillXPG(xpg), 'iframe', isSlideShelfIF);
  if (maybeIF && canAcessIf(maybeIF)) {
    // have slideself loader in top
    return doSlideShowInFrame(maybeIF.contentWindow, maybeIF.contentDocument);
  }
  // have slides in top
  return handleSlideDeck();
}

window.$WRIterator$ = init();
window.$WRIteratorHandler$ = async function() {
  const next = await $WRIterator$.next();
  return next.done;
};
