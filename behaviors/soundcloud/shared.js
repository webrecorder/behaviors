import * as lib from '../../lib';
import * as selectors from './selectors';

export const UserStreamItemClzz = 'userStreamItem';
export const CompactTrackListItemClzz = 'compactTrackList__item';

export function trackTitle(soundItem, fallback) {
  if (lib.hasClass(soundItem, UserStreamItemClzz)) {
    let title = lib.attr(soundItem.firstElementChild, 'aria-label');
    if (title) return title;
    title = (
      lib.innerTextOfSelected(selectors.soundItemTitle, soundItem) || 'A track'
    ).trim();
    const user = (
      lib.innerTextOfSelected(selectors.soundItemUser, soundItem) || ''
    ).trim();
    if (title && user) {
      return `${title} by ${user}`
    }
  } else if (lib.hasClass(soundItem, CompactTrackListItemClzz)) {
    const trackNumber = (
      lib.innerTextOfSelected(
        selectors.compactTrackListItemTrackNumber,
        soundItem
      ) || ''
    ).trim();
    const trackUser = (
      lib.innerTextOfSelected(selectors.compactTrackListItemUser, soundItem) ||
      ''
    ).trim();
    const trackTitle = (
      lib.innerTextOfSelected(selectors.compactTrackListItemTitle, soundItem) ||
      ''
    ).trim();
    if (trackNumber && trackUser && trackTitle) {
      return `(${trackNumber}) ${trackTitle} by ${trackUser}`;
    } else if (trackNumber && trackTitle) {
      return `(${trackNumber}) ${trackTitle}`;
    } else if (trackTitle) {
      return trackTitle;
    }
  }
  return fallback;
}
