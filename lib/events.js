import { getElementClientPageCenter } from './dom';
import { promiseResolveReject } from './general';

function __generateDetailPropForMouseEvent(type, clickCount) {
  switch (type) {
    case 'click':
    case 'dblclick':
      return clickCount;
    case 'mousedown':
    case 'mouseup':
      return clickCount + 1;
    default:
      return 0;
  }
}

function __getWhichButtonForEvent(type, buttons) {
  switch (type) {
    case 'click':
    case 'dblclick':
    case 'mousedown':
    case 'mouseup':
      return buttons ? 1 : 0;
    default:
      return 0;
  }
}

/**
 *
 * @param {Object<string, string|Element|Object>} options
 * @return {?MouseEvent}
 */
export function createMouseEvent(options) {
  if (options == null || options.type == null) return null;
  let eventPosition;
  if (options.elem && options.position == null) {
    eventPosition = getElementClientPageCenter(options.elem);
    // my internet skills did not turn up anything on how to fake
    // event cords in screen space.... so we just put something here
    eventPosition.screenX = eventPosition.clientX + eventPosition.pageX;
    eventPosition.screenY = eventPosition.clientY + eventPosition.pageY;
  } else {
    eventPosition = options.position;
  }
  const defaultOpts = {
    button: __getWhichButtonForEvent(options.type),
    buttons: __getWhichButtonForEvent(options.type, true),
    bubbles: true,
    cancelable: true,
    composed: true,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    view: options.view || window,
    detail: __generateDetailPropForMouseEvent(
      options.type,
      options.clickCount || 0
    )
  };
  const eventOpts = Object.assign(
    defaultOpts,
    eventPosition,
    options.eventOpts
  );
  return options.view != null
    ? new options.view.MouseEvent(options.type, eventOpts)
    : new MouseEvent(options.type, eventOpts);
}

/**
 *
 * @param {{ elem: !Element, eventNames: !Array<string>, view: ?Window, position: ?Object, eventOpts: ?Object }} options
 */
export function fireMouseEventsOnElement({
  elem,
  eventNames,
  view,
  position,
  eventOpts
}) {
  if (elem != null) {
    const numEvents = eventNames.length;
    for (var eventIdx = 0; eventIdx < numEvents; ++eventIdx) {
      elem.dispatchEvent(
        createMouseEvent({
          type: eventNames[eventIdx],
          elem,
          view,
          position,
          eventOpts
        })
      );
    }
  }
}

/**
 *
 * @param {Element} elem
 * @param {Event} event
 */
export function fireEventOn(elem, event) {
  if (elem != null) {
    elem.dispatchEvent(event);
  }
}

export const HTMLElementEventMap = {
  abort: 'abort',
  animationcancel: 'animationcancel',
  animationend: 'animationend',
  animationiteration: 'animationiteration',
  animationstart: 'animationstart',
  auxclick: 'auxclick',
  blur: 'blur',
  cancel: 'cancel',
  canplay: 'canplay',
  canplaythrough: 'canplaythrough',
  change: 'change',
  click: 'click',
  close: 'close',
  contextmenu: 'contextmenu',
  cuechange: 'cuechange',
  dblclick: 'dblclick',
  drag: 'drag',
  dragend: 'dragend',
  dragenter: 'dragenter',
  dragexit: 'dragexit',
  dragleave: 'dragleave',
  dragover: 'dragover',
  dragstart: 'dragstart',
  drop: 'drop',
  durationchange: 'durationchange',
  emptied: 'emptied',
  ended: 'ended',
  error: 'error',
  focus: 'focus',
  gotpointercapture: 'gotpointercapture',
  input: 'input',
  invalid: 'invalid',
  keydown: 'keydown',
  keypress: 'keypress',
  keyup: 'keyup',
  load: 'load',
  loadeddata: 'loadeddata',
  loadedmetadata: 'loadedmetadata',
  loadend: 'loadend',
  loadstart: 'loadstart',
  lostpointercapture: 'lostpointercapture',
  mousedown: 'mousedown',
  mouseenter: 'mouseenter',
  mouseleave: 'mouseleave',
  mousemove: 'mousemove',
  mouseout: 'mouseout',
  mouseover: 'mouseover',
  mouseup: 'mouseup',
  pause: 'pause',
  play: 'play',
  playing: 'playing',
  pointercancel: 'pointercancel',
  pointerdown: 'pointerdown',
  pointerenter: 'pointerenter',
  pointerleave: 'pointerleave',
  pointermove: 'pointermove',
  pointerout: 'pointerout',
  pointerover: 'pointerover',
  pointerup: 'pointerup',
  progress: 'progress',
  ratechange: 'ratechange',
  reset: 'reset',
  resize: 'resize',
  scroll: 'scroll',
  securitypolicyviolation: 'securitypolicyviolation',
  seeked: 'seeked',
  seeking: 'seeking',
  select: 'select',
  stalled: 'stalled',
  submit: 'submit',
  suspend: 'suspend',
  timeupdate: 'timeupdate',
  toggle: 'toggle',
  touchcancel: 'touchcancel',
  touchend: 'touchend',
  touchmove: 'touchmove',
  touchstart: 'touchstart',
  transitioncancel: 'transitioncancel',
  transitionend: 'transitionend',
  transitionrun: 'transitionrun',
  transitionstart: 'transitionstart',
  volumechange: 'volumechange',
  waiting: 'waiting',
  wheel: 'wheel',
  copy: 'copy',
  cut: 'cut',
  paste: 'paste',
  fullscreenchange: 'fullscreenchange',
  fullscreenerror: 'fullscreenerror'
};

/**
 *
 * @param {EventTarget} eventTarget
 * @param {string} event
 * @param {number} [safetyTo]
 * @return {Promise<boolean>}
 */
export function waitForEventTargetToFireEvent(eventTarget, event, safetyTo) {
  const promResolveReject = promiseResolveReject();
  const loaded = fromSafety => {
    eventTarget.removeEventListener(event, loaded);
    promResolveReject.resolve(!fromSafety);
  };
  eventTarget.addEventListener(event, loaded);
  if (safetyTo) {
    setTimeout(loaded, safetyTo, true);
  }
  return promResolveReject.promise;
}
