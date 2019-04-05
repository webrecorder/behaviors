module.exports = {
  'autoscrollBehavior.js': {
    name: 'autoScrollBehavior',
    description:
      'Scrolls the page a maximum of 100 times or until we can scroll no more. If media elements are discovered while scrolling they are played',
    defaultBehavior: true
  },
  'twitterTimelineBehavior.js': {
    name: 'twitterTimelineBehavior',
    defaultBehavior: false,
    description:
      'For each tweet within the timeline views each tweet. If the tweet has a video it is played. If the tweet is a part of a thread or has replies views all related tweets'
  },
  'twitterHashTagsBehavior.js': {
    name: 'twitterHashTagsBehavior',
    defaultBehavior: false,
    description:
      'For each tweet containing the searched hashtag views each tweet. If the tweet has a video it is played and a wait until network idle is done. If the tweet is a part of a thread or has replies views all related tweets'
  },
  'soundcloudEmbedBehavior.js': {
    name: 'soundCloudEmbedBehavior',
    defaultBehavior: false,
    description:
      'Plays all tracks or collection of that are in the soundcloud embed. Once a track has been played, the next track is not played until network idle has been reached'
  },
  'soundcloudArtistBehavior.js': {
    name: 'soundCloudArtistBehavior',
    defaultBehavior: false,
    description:
      'Plays all tracks or collection of tracks by the artist, Once a track has been played, the next track is not played until network idle has been reached'
  },
  'instagramUserBehavior.js': {
    name: 'instagramUserBehavior',
    defaultBehavior: false,
    description:
      "Views all the content on an instangram User's page: if the user has stories they are viewed, if a users post has image(s)/video(s) they are viewed, and all comments are retrieved"
  },
  'facebookUserFeedBehavior.js': {
    name: 'facebookUserFeed',
    defaultBehavior: false,
    description:
      'Views all items in the Facebook user/organization/artists/etc timeline'
  },
  'facebookNewsFeedBehavior.js': {
    name: 'facebookNewsFeed',
    defaultBehavior: false,
    description: 'Views all items in the Facebook news feed'
  },
  'youtubeVideoBehavior.js': {
    name: 'youtubeVideoBehavior',
    defaultBehavior: false,
    description: 'Plays a YouTube video and loads all comments'
  },
  'slideShareBehavior.js': {
    name: 'slideShareBehavior',
    defaultBehavior: false,
    description:
      'Views each slide contained in the slide deck. If there are multiple slide decks each deck is viewed'
  },
  'pinterestBehavior.js': {
    name: 'pinterestBehavior',
    defaultBehavior: false
  },
  'deathImitatesLanguageBehavior.js': {
    name: 'deathImitatesLanguageBehavior',
    defaultBehavior: false
  }
};
