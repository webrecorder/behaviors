import * as lib from '../lib';
import autoScrollBehavior from './autoscroll';

const selectors = {
  iframeLoader: 'iframe.ssIframeLoader',
  nextSlide: 'btnNext',
  slideContainer: 'div.slide_container',
  showingSlide: '.slide.show',
  divSlide: 'div.slide',
  sectionSlide: 'section.slide',
  slideImg: 'img.slide_image',
  relatedDecks: 'div.tab.related-tab',
  moreComments: 'a.j-more-comments',
  deckTitle: '.slideshowMetaData > a[title]',
  currentSlideNum: 'span#current-slide',
  totalSlidesNum: 'span#total-slide',
};

const isSlideShelfIF = _if => _if.src.endsWith('/slideshelf');

const Reporter = {
  state: {
    slides: 0,
    decks: 0,
  },
  viewingSlideDeck(deckTitle, numSlides) {
    this.state.slides += 1;
    const specifics = deckTitle ? `"${deckTitle}"` : `#${this.state.decks + 1}`;
    return lib.stateWithMsgNoWait(
      `Viewing slide deck ${specifics} with #${numSlides} slides`,
      this.state
    );
  },
  viewedSlideDeck(deckTitle, numSlides) {
    const specifics = deckTitle ? `"${deckTitle}"` : `#${this.state.decks + 1}`;
    this.state.decks += 1;
    return lib.stateWithMsgNoWait(
      `Viewed slide deck ${specifics} that had #${numSlides} slides`,
      this.state
    );
  },
  viewedSlide(deckTitle, totalSlides, slideN) {
    const specifics = deckTitle ? `"${deckTitle}"` : `#${this.state.decks + 1}`;
    this.state.slides += 1;
    return lib.stateWithMsgNoWait(
      `Viewing slide ${slideN} of ${totalSlides} from deck ${specifics}`,
      this.state
    );
  },
  done() {
    return lib.stateWithMsgNoWait(
      'Behavior done: Viewed all slide deck(s)',
      this.state
    );
  },
};

/**
 * @param {Document} doc
 */
function extracAndPreserveSlideImgs(doc) {
  const imgs = lib.qsa(selectors.slideImg, doc);
  const len = imgs.length;
  const toFetch = [];
  let imgDset;
  for (let i = 0; i < len; ++i) {
    imgDset = imgs[i].dataset;
    if (imgDset) {
      toFetch.push(imgDset.full);
      toFetch.push(imgDset.normal);
      toFetch.push(imgDset.small);
    }
  }
  lib.sendAutoFetchWorkerURLs(toFetch);
}

function totalNumberOfSlides(doc, slideSelector) {
  // attempt to get the total number of slides from the information displayed
  // in between the previous and next slide buttons
  const totalSlidesText = (
    lib.innerTextOfSelected(selectors.totalSlidesNum, doc) || ''
  ).trim();
  if (totalSlidesText) {
    const totalSlides = Number(totalSlidesText);
    if (!isNaN(totalSlides)) return totalSlides;
  }
  // fallback to determining the total number of slides from the rendered
  // slide sections
  const slideContainer = lib.qs(selectors.slideContainer, doc);
  if (slideContainer) {
    return lib.qsa(slideSelector, doc).length;
  }
  return -1;
}

function startingSlideNumber(doc) {
  // if the current slide number selector changes check the showing slide
  let startingSlideText = (
    lib.innerTextOfSelected(selectors.currentSlideNum, doc) ||
    lib.innerTextOfSelected(selectors.showingSlide, doc) ||
    ''
  ).trim();
  if (startingSlideText) {
    const startingSlideNum = Number(startingSlideText);
    if (!isNaN(startingSlideNum)) return startingSlideNum;
  }
  // fallback to starting at 1
  return 1;
}

/**
 * @param {Window} win
 * @param {Document} doc
 * @param {string} slideSelector
 * @param {?string} deckTitle
 * @return {AsyncIterableIterator<*>}
 */
async function* consumeSlides(win, doc, slideSelector, deckTitle) {
  // Note that the slide counter is 1 based and the deck always displays
  // the first slide (#1) when starting a deck at the beginning.
  // otherwise we gotta pick up where we are at
  const numSlides = totalNumberOfSlides(doc, slideSelector);
  yield Reporter.viewingSlideDeck(deckTitle, numSlides);
  extracAndPreserveSlideImgs(doc);
  for (var i = startingSlideNumber(doc); i < numSlides; ++i) {
    await lib.clickInContextWithDelay(
      lib.id(selectors.nextSlide, doc),
      win,
      500
    );
    yield Reporter.viewedSlide(deckTitle, numSlides, i + 1);
  }
  yield Reporter.viewedSlideDeck(deckTitle, numSlides);
}

/**
 * @return {AsyncIterableIterator<*>}
 */
async function* handleSlideDeck() {
  await lib.domCompletePromise();
  lib.collectOutlinksFromDoc();
  yield* consumeSlides(
    window,
    document,
    selectors.sectionSlide,
    (lib.innerTextOfSelected('.slideshow-title-text') || '').trim()
  );
  lib.collectOutlinksFromDoc();
  return Reporter.done();
}

/**
 * @param {Window} win
 * @param {Document} doc
 * @return {AsyncIterableIterator<*>}
 */
async function* doSlideShowInFrame(win, doc) {
  await lib.domCompletePromise();
  const decks = lib.qsa('li', lib.qs(selectors.relatedDecks, doc));
  const numDecks = decks.length;
  const deckIF = lib.qs(selectors.iframeLoader, doc);
  yield* consumeSlides(
    deckIF.contentWindow,
    deckIF.contentDocument,
    selectors.divSlide,
    lib.attr(lib.qs(selectors.deckTitle, doc), 'title')
  );
  for (var i = 1; i < numDecks; ++i) {
    lib.addOutlink(decks[i].firstElementChild);
    await Promise.all([
      lib.clickInContextWithDelay(decks[i].firstElementChild, win),
      lib.waitForEventTargetToFireEvent(deckIF, 'load'),
    ]);
    yield* consumeSlides(
      deckIF.contentWindow,
      deckIF.contentDocument,
      selectors.divSlide,
      lib.attr(lib.qs(selectors.deckTitle, doc), 'title')
    );
  }
  return Reporter.done();
}

/**
 * @return {AsyncIterableIterator<*>}
 */
export default function init(cliAPI) {
  if (lib.canAccessIf(lib.qs(selectors.iframeLoader))) {
    // 'have iframe loader in top'
    return doSlideShowInFrame(window, document);
  }
  const maybeIF = lib.findTag(cliAPI.$x, 'iframe', isSlideShelfIF);
  if (maybeIF && lib.canAccessIf(maybeIF)) {
    // have slideself loader in top
    return doSlideShowInFrame(maybeIF.contentWindow, maybeIF.contentDocument);
  }
  if (lib.selectorExists(selectors.sectionSlide, document)) {
    // have slides in top
    return handleSlideDeck();
  }
  // fallback
  return autoScrollBehavior({
    fallbackMsg:
      'There were not slide decks to be viewed, falling back to auto scroll',
  });
}

export const metadata = {
  name: 'slideShareBehavior',
  match: {
    regex: /^(?:https?:\/\/(?:www\.)?)slideshare\.net\/.+/,
  },
  description:
    'Capture each slide contained in the slide deck. If there are multiple slide decks, view and capture each deck.',
  updated: '2019-07-24T20:14:43-04:00',
};

export const isBehavior = true;
