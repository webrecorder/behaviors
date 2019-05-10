import * as lib from '../lib';

let styleClasses;
if (debug) {
  styleClasses = lib.addBehaviorStyle(
    '.wr-debug-visited {border: 6px solid #3232F1;} .wr-debug-visited-thread-reply {border: 6px solid green;} .wr-debug-visited-overlay {border: 6px solid pink;} .wr-debug-click {border: 6px solid red;}'
  );
}

const moreInfoButtonSelector = 'button.btn.btn-more-info';

export default async function* deathImitatesLanguageBehavior(cliAPI) {
  const rootContainer = document.body.firstElementChild;
  let child = rootContainer.firstElementChild;
  let totalItems = 0;
  while (child) {
    lib.addClass(child, styleClasses.wrDebugVisited);
    await lib.scrollIntoViewWithDelay(child);
    lib.collectOutlinksFrom(child);
    await lib.selectElemFromAndClickWithDelay(child, moreInfoButtonSelector);
    totalItems += 1;
    yield lib.stateWithMsgNoWait(`Viewed item #${totalItems}`);
    child = lib.getElemSibling(child);
  }
}

export const metaData = {
  name: 'deathImitatesLanguageBehavior',
  match: {
    regex: /^(?:https?:\/\/(?:www\.)?)?deathimitateslanguage\.harmvandendorpel\.com\/?$/
  }
};

export const isBehavior = true;
