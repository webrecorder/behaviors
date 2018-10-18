import DOM from '../utils/dom';
import Delays from '../utils/delays';
import Clicks from '../utils/clicks';
import Scrolls from '../utils/scrolls';

const userTimelineSelector =
  '//div[contains(@class, "userContentWrapper") and not(contains(@class, "wrvistited"))]';

const moreReplies = 'a[role="button"].UFIPagerLink';
const repliesToRepliesA = 'a[role="button"].UFICommentLink';
const repliesToRepliesSpan = 'span.UFIReplySocialSentenceLinkText.UFIReplySocialSentenceVerified';

const removeAnnoyingElemId = 'pagelet_growth_expanding_cta';
const delayTime = 1500;
const loadDelayTime = 3000;

async function* clickRepliesToReplies(tlItem) {
  let rToR = tlItem.querySelectorAll(repliesToRepliesA);
  let i = 0;
  let length = rToR.length;
  let rtr;
  while (i < length) {
    rtr = rToR[i];
    if (debug) rtr.classList.add('wr-debug-visited');
    await Clicks.scrollIntoViewAndClickWithDelay(rtr, delayTime);
    yield rtr;
    i += 1;
  }
  rToR = tlItem.querySelectorAll(repliesToRepliesA);
  if (rToR.length) {
    i = 0;
    length = rToR.length;
    while (i < length) {
      rtr = rToR[i];
      if (debug) rtr.classList.add('wr-debug-visited');
      await Clicks.scrollIntoViewAndClickWithDelay(rtr, delayTime);
      yield rToR;
      i += 1;
    }
  }
  await Delays.delay(delayTime);
}

async function* makeIterator(xpathGenerator) {
  const xpg = DOM.maybePolyfillXPG(xpathGenerator);
  let timelineItems = xpg(userTimelineSelector);
  let tlItem;
  let replies;
  do {
    while (timelineItems.length > 0) {
      tlItem = timelineItems.shift();
      if (window.$WRSTP$) return;
      if (debug) tlItem.classList.add('wr-debug-visited');
      await Scrolls.scrollIntoViewWithDelay(tlItem, delayTime);
      DOM.markElemAsVisited(tlItem);
      yield tlItem;
      replies = tlItem.querySelector(moreReplies);
      if (replies) {
        if (debug) replies.classList.add('wr-debug-visited');
        await Clicks.scrollIntoViewAndClickWithDelay(replies, delayTime);
        yield replies;
      }
      yield* clickRepliesToReplies(tlItem);
    }
    if (window.$WRSTP$) return;
    timelineItems = xpg(userTimelineSelector);
    if (timelineItems.length === 0) {
      await Scrolls.scrollDownByElemHeightWithDelay(tlItem, loadDelayTime);
      timelineItems = xpg(userTimelineSelector);
    }
    if (window.$WRSTP$) return;
  } while (timelineItems.length > 0 && Clicks.canScrollMore());
}

let removedAnnoying = DOM.maybeRemoveElemById(removeAnnoyingElemId);
window.$WRTLIterator$ = makeIterator(xpg);
window.$WRIteratorHandler$ = async function () {
  if (!removedAnnoying) {
    removedAnnoying = DOM.maybeRemoveElemById(removeAnnoyingElemId);
  }
  const next = await $WRTLIterator$.next();
  return next.done;
};
