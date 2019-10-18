import { getElementClientPageCenter } from './dom';
import { promiseResolveReject } from './general';

/**
 * @param {string} type
 * @param {number} clickCount
 * @return {number}
 * @private
 */
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

/**
 * @param {string} type
 * @param {boolean} [buttons]
 * @return {number}
 * @private
 */
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
 * @typedef {Object} CreateMouseEventOptions
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/MouseEvent
 * @property {string} type - The type of the mouse event to be created
 * @property {Element} [elem] - The element the mouse event will be fired on used to calculate mouse position
 * @property {Object} [position] - An object specifying the events position
 * @property {Object} [eventOpts] - Additional options to be used
 * @property {Window} [view] - The view (window)
 * @property {number} [clickCount] - How many clicks have been done before this event
 */

/**
 * Creates and returns a new mouse event configured using the supplied options
 * @param {CreateMouseEventOptions} config
 * @return {MouseEvent}
 */
export function createMouseEvent(config) {
  let eventPosition;
  if (config.elem && config.position == null) {
    eventPosition = getElementClientPageCenter(config.elem);
    // my internet skills did not turn up anything on how to fake
    // event cords in screen space.... so we just put something here
    eventPosition.screenX = eventPosition.clientX + eventPosition.pageX;
    eventPosition.screenY = eventPosition.clientY + eventPosition.pageY;
  } else {
    eventPosition = config.position;
  }
  const defaultOpts = {
    button: __getWhichButtonForEvent(config.type),
    buttons: __getWhichButtonForEvent(config.type, true),
    bubbles: true,
    cancelable: true,
    composed: true,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    view: config.view || window,
    detail: __generateDetailPropForMouseEvent(
      config.type,
      config.clickCount || 0
    ),
  };
  const eventOpts = Object.assign(defaultOpts, eventPosition, config.eventOpts);
  return config.view != null
    ? new config.view.MouseEvent(config.type, eventOpts)
    : new MouseEvent(config.type, eventOpts);
}

/**
 * @typedef {Object} FireMouseEventsOnOptions
 * @property {Element} elem - The element the mouse event will be fired on used to calculate mouse position
 * @property {Array<string>} eventNames - The event types to be fired
 * @property {Window} [view] - The view (window)
 * @property {Object} [position] - An object specifying the events position
 * @property {Object} [eventOpts] - Additional options to be used
 * @property {number} [clickCount] - How many clicks have been done before this event
 */

/**
 * Creates mouse events and fires them in order configured using the supplied options
 * @param {FireMouseEventsOnOptions} config
 */
export function fireMouseEventsOnElement(config) {
  const { elem, eventNames, view, position, eventOpts, clickCount } = config;
  if (elem != null) {
    const numEvents = eventNames.length;
    for (var eventIdx = 0; eventIdx < numEvents; ++eventIdx) {
      elem.dispatchEvent(
        createMouseEvent({
          type: eventNames[eventIdx],
          elem,
          view,
          position,
          eventOpts,
          clickCount,
        })
      );
    }
  }
}

/**
 * Fires the supplied event on the supplied element
 * @param {Element} elem - The element to have an event fired on
 * @param {Event} event - The event to be fired
 */
export function fireEventOn(elem, event) {
  if (elem != null) {
    elem.dispatchEvent(event);
  }
}
