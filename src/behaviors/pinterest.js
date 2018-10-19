import { addBehaviorStyle, maybePolyfillXPG } from '../utils/dom';
import { scrollIntoViewWithDelay } from '../utils/scrolls';
import {
  reactInstanceFromDOMElem,
  reactInstancesFromElements
} from '../utils/reactUtils';
import OLC from '../utils/outlinkCollector';

addBehaviorStyle('.wr-debug-visited {border: 6px solid #3232F1;}');


async function* consumePins(renderedPins) {
  let pin;
  let i = 0;
  let numPins = renderedPins.length;
  for (; i < numPins; ++i) {
    // scroll post row into view
    pin = renderedPins[i];
    OLC.collectFrom(pin.node);
    await scrollIntoViewWithDelay(pin.node);
    // pin.node.classList.add('wr-debug-visited');
    yield pin.node;
  }
}

const selectors = {
  gridImage: 'div[data-grid-item]',
  gridContainer: 'div.gridCentered > div > div > div'
};

function getGridContainer() {
  const firstChild = document.querySelector(selectors.gridImage);
  const container = firstChild.parentElement;
  if (container !== document.querySelector(selectors.gridContainer)) {
    throw new Error('wrong container');
  }
  return container;
}

async function* iteratePins(xpathGenerator) {
  const seenPins = new Set();
  const pinContainerR = reactInstanceFromDOMElem(getGridContainer());
  const keySelector = key => {
    const select = !seenPins.has(key);
    if (select) {
      seenPins.add(key);
    }
    return select;
  };
  const getRenderedPins = () =>
    reactInstancesFromElements(pinContainerR.stateNode.childNodes, keySelector);
  let currentPostRows = getRenderedPins();
  // consume rows until all posts have been loaded
  do {
    yield* consumePins(currentPostRows);
    currentPostRows = getRenderedPins();
  } while (currentPostRows.length > 0);
  // finish consuming the rows until we are done
  if (currentPostRows.length === 0) {
    currentPostRows = getRenderedPins();
  }
  do {
    yield* consumePins(currentPostRows);
    currentPostRows = getRenderedPins();
  } while (currentPostRows.length > 0);
}

window.$WRIterator$ = iteratePins(maybePolyfillXPG(xpg));
window.$WRIteratorHandler$ = async function() {
  const next = await $WRIterator$.next();
  return next.done;
};
