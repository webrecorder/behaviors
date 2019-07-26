import * as lib from '../../lib';
import * as selectors from './selectors';

let behaviorStyle;
if (debug) {
  behaviorStyle = lib.addBehaviorStyle(
    '.wr-debug-visited {border: 6px solid #3232F1;} .wr-debug-visited-thread-reply {border: 6px solid green;} .wr-debug-visited-overlay {border: 6px solid pink;} .wr-debug-click {border: 6px solid red;}'
  );
}

function isMultiTrackEmbed(xpathGenerator) {
  return xpathGenerator(selectors.soundListItemXpath).length > 0;
}

async function* playMultiTracks(xpathGenerator) {
  let snapShot = xpathGenerator(selectors.soundListItemXpath);
  let soundItem;
  let i, len;
  if (snapShot.length === 0) return;
  let totalTracks = 0;
  do {
    len = snapShot.length;
    for (i = 0; i < len; ++i) {
      soundItem = snapShot[i];
      if (debug) {
        lib.addClass(soundItem, behaviorStyle.wrDebugVisited);
      }
      totalTracks += 1;
      await lib.scrollIntoViewWithDelay(soundItem);

      yield lib.createState(
        lib.selectElemFromAndClick(soundItem, selectors.soundItem),
        `Played track #${totalTracks}`
      );
    }
    snapShot = xpathGenerator(selectors.soundListItemXpath);
    if (snapShot.length === 0) {
      await lib.delay();
      snapShot = xpathGenerator(selectors.soundListItemXpath);
    }
  } while (snapShot.length > 0);
}

export default async function* soundCloudEmbedBehavior(cliAPI) {
  if (isMultiTrackEmbed(cliAPI.$x)) {
    yield* playMultiTracks(cliAPI.$x);
  } else {
    yield lib.createState(
      lib.selectElemFromAndClick(document, selectors.singleTrackEmbedPlay),
      'Played single track'
    );
  }
}

export const metadata = {
  name: 'soundCloudEmbedBehavior',
  displayName: 'Soundcloud Embed',
  match: {
    regex: /^https?:\/\/w\.soundcloud\.com\/player\/.+/,
  },
  description: 'Capture every track in the Soundcloud embed.',
  updated: '2019-07-23T17:13:14-04:00',
};

export const isBehavior = true;
