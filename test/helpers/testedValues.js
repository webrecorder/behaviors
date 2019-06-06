module.exports = [
  {
    name: 'Autoscroll',
    infoURL: 'http://localhost:3030/info?url=https://example.com',
    infoByNameURL: 'http://localhost:3030/info?name=autoScrollBehavior',
    behaviorURL: 'http://localhost:3030/behavior?url=https://example.com',
    behaviorByNameURL: 'http://localhost:3030/behavior?name=autoScrollBehavior',
    metadata: {
      name: 'autoScrollBehavior',
      defaultBehavior: true,
      description:
        'Scrolls the page until we can scroll no more. If media elements are discovered while scrolling they are played',
      fileName: 'autoscrollBehavior.js',
    },
    url: 'https://example.com',
  },
  {
    name: 'Deathimitateslanguage',
    infoURL:
      'http://localhost:3030/info?url=https://deathimitateslanguage.harmvandendorpel.com',
    infoByNameURL:
      'http://localhost:3030/info?name=deathImitatesLanguageBehavior',
    behaviorURL:
      'http://localhost:3030/behavior?url=https://deathimitateslanguage.harmvandendorpel.com',
    behaviorByNameURL:
      'http://localhost:3030/behavior?name=deathImitatesLanguageBehavior',
    metadata: {
      name: 'deathImitatesLanguageBehavior',
      match: {
        regex:
          '^(?:https?:\\/\\/(?:www\\.)?)?deathimitateslanguage\\.harmvandendorpel\\.com\\/?$',
      },
      description:
        'Scrolls the page clicking all the images rendered at the current scroll level',
      fileName: 'deathImitatesLanguageBehavior.js',
    },
    url: 'https://deathimitateslanguage.harmvandendorpel.com',
  },
  {
    name: 'Slideshare',
    infoURL:
      'http://localhost:3030/info?url=https://www.slideshare.net/annaperricci?utm_campaign=profiletracking&utm_medium=sssite&utm_source=ssslideview',
    infoByNameURL: 'http://localhost:3030/info?name=slideShareBehavior',
    behaviorURL:
      'http://localhost:3030/behavior?url=https://www.slideshare.net/annaperricci?utm_campaign=profiletracking&utm_medium=sssite&utm_source=ssslideview',
    behaviorByNameURL: 'http://localhost:3030/behavior?name=slideShareBehavior',
    metadata: {
      name: 'slideShareBehavior',
      match: {
        regex: '^(?:https:\\/\\/(?:www\\.)?)slideshare\\.net\\/[a-zA-Z]+[?].+',
      },
      description:
        'Views each slide contained in the slide deck. If there are multiple slide decks each deck is viewed',
      fileName: 'slideShareBehavior.js',
    },
    url:
      'https://www.slideshare.net/annaperricci?utm_campaign=profiletracking&utm_medium=sssite&utm_source=ssslideview',
  },
  {
    name: 'Youtube',
    infoURL:
      'http://localhost:3030/info?url=https://www.youtube.com/watch?v=MfH0oirdHLs',
    infoByNameURL: 'http://localhost:3030/info?name=youtubeVideoBehavior',
    behaviorURL:
      'http://localhost:3030/behavior?url=https://www.youtube.com/watch?v=MfH0oirdHLs',
    behaviorByNameURL:
      'http://localhost:3030/behavior?name=youtubeVideoBehavior',
    metadata: {
      name: 'youtubeVideoBehavior',
      match: {
        regex: '^(?:https:\\/\\/(?:www\\.)?)?youtube\\.com\\/watch[?]v=.+',
      },
      description: 'Plays a YouTube video and loads all comments',
      fileName: 'youtubeVideoBehavior.js',
    },
    url: 'https://www.youtube.com/watch?v=MfH0oirdHLs',
  },
  {
    name: 'Facebook Newsfeed',
    infoURL: 'http://localhost:3030/info?url=https://www.facebook.com',
    infoByNameURL: 'http://localhost:3030/info?url=https://www.facebook.com',
    behaviorURL: 'http://localhost:3030/behavior?name=facebookNewsFeed',
    behaviorByNameURL: 'http://localhost:3030/behavior?name=facebookNewsFeed',
    metadata: {
      name: 'facebookNewsFeed',
      match: {
        regex: '^https:\\/\\/(www\\.)?facebook\\.com(\\/)?([?]sk=nf)?$',
      },
      description: 'Views all items in the Facebook news feed',
      fileName: 'facebookNewsFeedBehavior.js',
    },
    url: 'https://www.facebook.com',
  },
  {
    name: 'Facebook Userfeed',
    infoURL:
      'http://localhost:3030/info?url=https://www.facebook.com/Smithsonian/',
    infoByNameURL:
      'http://localhost:3030/info?url=https://www.facebook.com/Smithsonian/',
    behaviorURL: 'http://localhost:3030/behavior?name=facebookUserFeed',
    behaviorByNameURL: 'http://localhost:3030/behavior?name=facebookUserFeed',
    metadata: {
      name: 'facebookUserFeed',
      match: {
        regex: '^https:\\/\\/(www\\.)?facebook\\.com\\/[^\\/]+\\/?$',
      },
      description:
        'Views all items in the Facebook user/organization/artists/etc timeline',
      fileName: 'facebookUserFeedBehavior.js',
    },
    url: 'https://www.facebook.com/Smithsonian/',
  },
  {
    name: 'Instagram Post',
    infoURL:
      'http://localhost:3030/info?url=https://www.instagram.com/p/Bxiub6BB0Ab/',
    infoByNameURL:
      'http://localhost:3030/info?url=https://www.instagram.com/p/Bxiub6BB0Ab/',
    behaviorURL: 'http://localhost:3030/behavior?name=instagramPostBehavior',
    behaviorByNameURL:
      'http://localhost:3030/behavior?name=instagramPostBehavior',
    metadata: {
      name: 'instagramPostBehavior',
      match: {
        regex: '^https:\\/\\/(www\\.)?instagram\\.com\\/p\\/[^\\/]+(?:\\/)?$',
      },
      description:
        "Views all the content on an instangram User's page: if the user has stories they are viewed, if a users post has image(s)/video(s) they are viewed, and all comments are retrieved",
      fileName: 'instagramPostBehavior.js',
    },
    url: 'https://www.instagram.com/p/Bxiub6BB0Ab/',
  },
  {
    name: 'Instagram User',
    infoURL:
      'http://localhost:3030/info?url=https://www.instagram.com/rhizomedotorg',
    infoByNameURL:
      'http://localhost:3030/info?url=https://www.instagram.com/rhizomedotorg',
    behaviorURL: 'http://localhost:3030/behavior?name=instagramUserBehavior',
    behaviorByNameURL:
      'http://localhost:3030/behavior?name=instagramUserBehavior',
    metadata: {
      name: 'instagramUserBehavior',
      match: {
        regex:
          '^https:\\/\\/(www\\.)?instagram\\.com\\/[^\\/]+(?:\\/(?:tagged(?:\\/)?)?)?$',
      },
      description:
        "Views all the content on an instangram User's page: if the user has stories they are viewed, if a users post has image(s)/video(s) they are viewed, and all comments are retrieved",
      fileName: 'instagramUserBehavior.js',
    },
    url: 'https://www.instagram.com/rhizomedotorg',
  },
  {
    name: 'Soundcloud Artist',
    infoURL:
      'http://localhost:3030/info?url=https://soundcloud.com/perturbator',
    infoByNameURL:
      'http://localhost:3030/info?url=https://soundcloud.com/perturbator',
    behaviorURL: 'http://localhost:3030/behavior?name=soundCloudArtistBehavior',
    behaviorByNameURL:
      'http://localhost:3030/behavior?name=soundCloudArtistBehavior',
    metadata: {
      name: 'soundCloudArtistBehavior',
      match: {
        regex: '^(?:https:\\/\\/(?:www\\.)?)?soundcloud\\.com\\/[^\\/]+(\\/)?$',
      },
      description:
        'Plays all tracks or collection of tracks by the artist, Once a track has been played, the next track is not played until network idle has been reached',
      fileName: 'soundcloudArtistBehavior.js',
    },
    url: 'https://soundcloud.com/perturbator',
  },
  {
    name: 'Soundcloud Embed',
    infoURL:
      'http://localhost:3030/info?url=https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/598793067&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true',
    infoByNameURL:
      'http://localhost:3030/info?url=https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/598793067&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true',
    behaviorURL: 'http://localhost:3030/behavior?name=soundCloudEmbedBehavior',
    behaviorByNameURL:
      'http://localhost:3030/behavior?name=soundCloudEmbedBehavior',
    metadata: {
      name: 'soundCloudEmbedBehavior',
      match: {
        regex: '^https:\\/\\/w\\.soundcloud\\.com\\/player\\/.+',
      },
      description:
        'Plays all tracks or collection of that are in the soundcloud embed. Once a track has been played, the next track is not played until network idle has been reached',
      fileName: 'soundcloudEmbedBehavior.js',
    },
    url:
      'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/598793067&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true',
  },
  {
    name: 'Twitter Hashtags',
    infoURL:
      'http://localhost:3030/info?url=https://twitter.com/hashtag/iipcwac18?vertical=default&src=hash',
    infoByNameURL:
      'http://localhost:3030/info?url=https://twitter.com/hashtag/iipcwac18?vertical=default&src=hash',
    behaviorURL: 'http://localhost:3030/behavior?name=twitterHashTagsBehavior',
    behaviorByNameURL:
      'http://localhost:3030/behavior?name=twitterHashTagsBehavior',
    metadata: {
      name: 'twitterHashTagsBehavior',
      match: {
        regex: '^(?:https:\\/\\/(?:www\\.)?)?twitter\\.com\\/hashtag\\/[^?]+.*',
      },
      description:
        'For each tweet containing the searched hashtag views each tweet. If the tweet has a video it is played and a wait until network idle is done. If the tweet is a part of a thread or has replies views all related tweets',
      fileName: 'twitterHashTagsBehavior.js',
    },
    url: 'https://twitter.com/hashtag/iipcwac18?vertical=default&src=hash',
  },
  {
    name: 'Twitter Timeline',
    infoURL:
      'http://localhost:3030/info?url=https://twitter.com/webrecorder_io',
    infoByNameURL:
      'http://localhost:3030/info?url=https://twitter.com/webrecorder_io',
    behaviorURL: 'http://localhost:3030/behavior?name=twitterTimelineBehavior',
    behaviorByNameURL:
      'http://localhost:3030/behavior?name=twitterTimelineBehavior',
    metadata: {
      name: 'twitterTimelineBehavior',
      match: {
        regex: '^(?:https:\\/\\/(?:www\\.)?)?twitter\\.com\\/[^\\/]+$',
      },
      description:
        'For each tweet within the timeline views each tweet. If the tweet has a video it is played. If the tweet is a part of a thread or has replies views all related tweets',
      fileName: 'twitterTimelineBehavior.js',
    },
    url: 'https://twitter.com/webrecorder_io',
  },
];
