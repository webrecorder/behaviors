import { canAcessIf } from '../utils/dom';

const selectors = {
  iframeLoader: 'iframe.ssIframeLoader'
};

console.log(canAcessIf(document.querySelector(selectors.iframeLoader)))
