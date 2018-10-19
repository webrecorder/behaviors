import {
  addBehaviorStyle,
  markElemAsVisited,
  maybePolyfillXPG,
  maybeRemoveElemById
} from '../utils/dom';
import {
  canScrollMore,
  scrollDownByElemHeightWithDelay,
  scrollIntoViewWithDelay
} from '../utils/scrolls';
import { scrollIntoViewAndClickWithDelay } from '../utils/clicks';
import OLC from '../utils/outlinkCollector';

addBehaviorStyle('.wr-debug-visited {border: 6px solid #3232F1;}');

const userTimelineSelector =
  '//div[contains(@class, "userContentWrapper") and not(contains(@class, "wrvistited"))]';

const moreReplies = 'a[role="button"].UFIPagerLink';
const repliesToRepliesA = 'a[role="button"].UFICommentLink';
const repliesToRepliesSpan =
  'span.UFIReplySocialSentenceLinkText.UFIReplySocialSentenceVerified';

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
    await scrollIntoViewAndClickWithDelay(rtr, delayTime);
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
      await scrollIntoViewAndClickWithDelay(rtr, delayTime);
      yield rToR;
      i += 1;
    }
  }
}

async function* makeIterator(xpathGenerator) {
  let timelineItems = xpathGenerator(userTimelineSelector);
  let tlItem;
  let replies;
  do {
    while (timelineItems.length > 0) {
      tlItem = timelineItems.shift();
      if (debug) tlItem.classList.add('wr-debug-visited');
      await scrollIntoViewWithDelay(tlItem, delayTime);
      markElemAsVisited(tlItem);
      OLC.collectFrom(tlItem);
      yield tlItem;
      replies = tlItem.querySelector(moreReplies);
      if (replies) {
        if (debug) replies.classList.add('wr-debug-visited');
        await scrollIntoViewAndClickWithDelay(replies, delayTime);
        yield replies;
      }
      yield* clickRepliesToReplies(tlItem);
    }
    timelineItems = xpathGenerator(userTimelineSelector);
    if (timelineItems.length === 0) {
      await scrollDownByElemHeightWithDelay(tlItem, loadDelayTime);
      timelineItems = xpathGenerator(userTimelineSelector);
    }
  } while (timelineItems.length > 0 && canScrollMore());
}

let removedAnnoying = maybeRemoveElemById(removeAnnoyingElemId);
window.$WRTLIterator$ = makeIterator(maybePolyfillXPG(xpg));
window.$WRIteratorHandler$ = async function() {
  if (!removedAnnoying) {
    removedAnnoying = maybeRemoveElemById(removeAnnoyingElemId);
  }
  const next = await $WRTLIterator$.next();
  return next.done;
};
