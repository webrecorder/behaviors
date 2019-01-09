export const selectors = {
  loadMoreTracks: 'a.compactTrackList__moreLink',
  playSingleTrack: 'a.playButton',
  multiTrackItem: 'li.compactTrackList__item',
  playMultiTrackTrack: 'div.compactTrackListItem.clickToPlay',
  soundItem: 'div.soundItem',
  singleTrackEmbedPlay: 'button[role="application"].playButton'
};

export const xpQueries = {
  soundItem:
    '//div[@class="userStreamItem" and not(contains(@class, "wrvistited"))]',
  soundListItem:
    '//li[contains(@class, "soundsList__item") and not(contains(@class, "wrvistited"))]'
};
