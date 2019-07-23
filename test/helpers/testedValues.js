module.exports = {
  tests: [
    {
      name: 'Autoscroll',
      metadata: {
        name: 'autoScrollBehavior',
        defaultBehavior: true,
        description:
          'Automatically scroll down the page and capture any embedded content. If more content loads, scrolling will continue until autopilot is stopped by user.',
        updated: '2019-07-10T10:32:26',
        fileName: 'autoscrollBehavior.js',
      },
      url: 'https://example.com',
      infoURL: 'http://localhost:3030/info?url=https://example.com',
      infoByNameURL: 'http://localhost:3030/info?name=autoScrollBehavior',
      infoListURL: 'http://localhost:3030/info-list?url=https://example.com',
      infoListByNameURL:
        'http://localhost:3030/info-list?name=autoScrollBehavior',
      behaviorURL: 'http://localhost:3030/behavior?url=https://example.com',
      behaviorByNameURL:
        'http://localhost:3030/behavior?name=autoScrollBehavior',
    },
    {
      name: 'Deathimitateslanguage',
      metadata: {
        name: 'deathImitatesLanguageBehavior',
        match: {
          regex:
            '^(?:https?:\\/\\/(?:www\\.)?)?deathimitateslanguage\\.harmvandendorpel\\.com\\/?$',
        },
        description:
          'Scrolls the page clicking all the images rendered at the current scroll level',
        updated: '2019-06-06T12:55:43',
        fileName: 'deathImitatesLanguageBehavior.js',
      },
      url: 'https://deathimitateslanguage.harmvandendorpel.com',
      infoURL:
        'http://localhost:3030/info?url=https://deathimitateslanguage.harmvandendorpel.com',
      infoByNameURL:
        'http://localhost:3030/info?name=deathImitatesLanguageBehavior',
      infoListURL:
        'http://localhost:3030/info-list?url=https://deathimitateslanguage.harmvandendorpel.com',
      infoListByNameURL:
        'http://localhost:3030/info-list?name=deathImitatesLanguageBehavior',
      behaviorURL:
        'http://localhost:3030/behavior?url=https://deathimitateslanguage.harmvandendorpel.com',
      behaviorByNameURL:
        'http://localhost:3030/behavior?name=deathImitatesLanguageBehavior',
    },
    {
      name: 'Slideshare',
      metadata: {
        name: 'slideShareBehavior',
        match: {
          regex:
            '^(?:https:\\/\\/(?:www\\.)?)slideshare\\.net\\/[a-zA-Z]+[?].+',
        },
        description:
          'Capture each slide contained in the slide deck. If there are multiple slide decks, view and capture each deck.',
        updated: '2019-06-24T15:09:02',
        fileName: 'slideShareBehavior.js',
      },
      url:
        'https://www.slideshare.net/annaperricci?utm_campaign=profiletracking&utm_medium=sssite&utm_source=ssslideview',
      infoURL:
        'http://localhost:3030/info?url=https://www.slideshare.net/annaperricci?utm_campaign=profiletracking&utm_medium=sssite&utm_source=ssslideview',
      infoByNameURL: 'http://localhost:3030/info?name=slideShareBehavior',
      infoListURL:
        'http://localhost:3030/info-list?url=https://www.slideshare.net/annaperricci?utm_campaign=profiletracking&utm_medium=sssite&utm_source=ssslideview',
      infoListByNameURL:
        'http://localhost:3030/info-list?name=slideShareBehavior',
      behaviorURL:
        'http://localhost:3030/behavior?url=https://www.slideshare.net/annaperricci?utm_campaign=profiletracking&utm_medium=sssite&utm_source=ssslideview',
      behaviorByNameURL:
        'http://localhost:3030/behavior?name=slideShareBehavior',
    },
    {
      name: 'Youtube',
      metadata: {
        name: 'youtubeVideoBehavior',
        match: {
          regex: '^(?:https:\\/\\/(?:www\\.)?)?youtube\\.com\\/watch[?]v=.+',
        },
        description: 'Capture the YouTube video and all comments.',
        updated: '2019-06-24T15:09:02',
        fileName: 'youtubeVideoBehavior.js',
      },
      url: 'https://www.youtube.com/watch?v=MfH0oirdHLs',
      infoURL:
        'http://localhost:3030/info?url=https://www.youtube.com/watch?v=MfH0oirdHLs',
      infoByNameURL: 'http://localhost:3030/info?name=youtubeVideoBehavior',
      infoListURL:
        'http://localhost:3030/info-list?url=https://www.youtube.com/watch?v=MfH0oirdHLs',
      infoListByNameURL:
        'http://localhost:3030/info-list?name=youtubeVideoBehavior',
      behaviorURL:
        'http://localhost:3030/behavior?url=https://www.youtube.com/watch?v=MfH0oirdHLs',
      behaviorByNameURL:
        'http://localhost:3030/behavior?name=youtubeVideoBehavior',
    },
    {
      name: 'Facebook Newsfeed',
      metadata: {
        name: 'facebookNewsFeed',
        match: {
          regex: '^https:\\/\\/(www\\.)?facebook\\.com(\\/)?([?]sk=nf)?$',
        },
        description:
          'Capture all items and comments in the Facebook timeline and scroll down to load more.',
        updated: '2019-06-25T16:16:14',
        fileName: 'facebookNewsFeedBehavior.js',
      },
      url: 'https://www.facebook.com',
      infoURL: 'http://localhost:3030/info?url=https://www.facebook.com',
      infoByNameURL: 'http://localhost:3030/info?name=facebookNewsFeed',
      infoListURL:
        'http://localhost:3030/info-list?url=https://www.facebook.com',
      infoListByNameURL:
        'http://localhost:3030/info-list?name=facebookNewsFeed',
      behaviorURL:
        'http://localhost:3030/behavior?url=https://www.facebook.com',
      behaviorByNameURL: 'http://localhost:3030/behavior?name=facebookNewsFeed',
    },
    {
      name: 'Facebook Userfeed',
      metadata: {
        name: 'facebookUserFeed',
        match: {
          regex: '^https:\\/\\/(www\\.)?facebook\\.com\\/[^\\/]+\\/?$',
        },
        description:
          'Capture all items and comments in the Facebook page and scroll down to load more content where possible.',
        updated: '2019-06-25T16:16:14',
        fileName: 'facebookUserFeedBehavior.js',
      },
      url: 'https://www.facebook.com/Smithsonian/',
      infoURL:
        'http://localhost:3030/info?url=https://www.facebook.com/Smithsonian/',
      infoByNameURL: 'http://localhost:3030/info?name=facebookUserFeed',
      infoListURL:
        'http://localhost:3030/info-list?url=https://www.facebook.com/Smithsonian/',
      infoListByNameURL:
        'http://localhost:3030/info-list?name=facebookUserFeed',
      behaviorURL:
        'http://localhost:3030/behavior?url=https://www.facebook.com/Smithsonian/',
      behaviorByNameURL: 'http://localhost:3030/behavior?name=facebookUserFeed',
    },
    {
      name: 'Instagram Own',
      metadata: {
        name: 'instagramOwnFeedBehavior',
        match: {
          regex: '^https:\\/\\/(www\\.)?instagram\\.com(?:\\/)?$',
        },
        description:
          'Capture all stories, images, videos and comments on the logged in users feed.',
        updated: '2019-07-15T22:29:05',
        fileName: 'instagramOwnFeedBehavior.js',
      },
      url: 'https://www.instagram.com/',
      infoURL: 'http://localhost:3030/info?url=https://www.instagram.com/',
      infoByNameURL: 'http://localhost:3030/info?name=instagramOwnFeedBehavior',
      infoListURL:
        'http://localhost:3030/info-list?url=https://www.instagram.com/',
      infoListByNameURL:
        'http://localhost:3030/info-list?name=instagramOwnFeedBehavior',
      behaviorURL:
        'http://localhost:3030/behavior?url=https://www.instagram.com/',
      behaviorByNameURL:
        'http://localhost:3030/behavior?name=instagramOwnFeedBehavior',
    },
    {
      name: 'Instagram Post',
      metadata: {
        name: 'instagramPostBehavior',
        match: {
          regex: '^https:\\/\\/(www\\.)?instagram\\.com\\/p\\/[^\\/]+(?:\\/)?$',
        },
        description:
          'Capture every image and/or video, retrieve all comments, and scroll down to load more.',
        updated: '2019-07-15T22:29:05',
        fileName: 'instagramPostBehavior.js',
      },
      url: 'https://www.instagram.com/p/Bxiub6BB0Ab',
      infoURL:
        'http://localhost:3030/info?url=https://www.instagram.com/p/Bxiub6BB0Ab',
      infoByNameURL: 'http://localhost:3030/info?name=instagramPostBehavior',
      infoListURL:
        'http://localhost:3030/info-list?url=https://www.instagram.com/p/Bxiub6BB0Ab',
      infoListByNameURL:
        'http://localhost:3030/info-list?name=instagramPostBehavior',
      behaviorURL:
        'http://localhost:3030/behavior?url=https://www.instagram.com/p/Bxiub6BB0Ab',
      behaviorByNameURL:
        'http://localhost:3030/behavior?name=instagramPostBehavior',
    },
    {
      name: 'Instagram User',
      metadata: {
        name: 'instagramUserBehavior',
        match: {
          regex:
            '^https:\\/\\/(www\\.)?instagram\\.com\\/[^\\/]+(?:\\/(?:[?].+)?(?:tagged(?:\\/)?)?)?$',
        },
        description:
          'Capture all stories, images, videos and comments on user’s page.',
        updated: '2019-07-15T22:29:05',
        fileName: 'instagramUserBehavior.js',
      },
      url: 'https://www.instagram.com/rhizomedotorg/',
      infoURL:
        'http://localhost:3030/info?url=https://www.instagram.com/rhizomedotorg/',
      infoByNameURL: 'http://localhost:3030/info?name=instagramUserBehavior',
      infoListURL:
        'http://localhost:3030/info-list?url=https://www.instagram.com/rhizomedotorg/',
      infoListByNameURL:
        'http://localhost:3030/info-list?name=instagramUserBehavior',
      behaviorURL:
        'http://localhost:3030/behavior?url=https://www.instagram.com/rhizomedotorg/',
      behaviorByNameURL:
        'http://localhost:3030/behavior?name=instagramUserBehavior',
    },
    {
      name: 'Soundcloud Artist',
      metadata: {
        name: 'soundCloudArtistBehavior',
        match: {
          regex:
            '^(?:https:\\/\\/(?:www\\.)?)?soundcloud\\.com\\/(?!(?:discover|stream))[^\\/]+(?:\\/(?:tracks|albums|sets|reposts))?(?:\\/)?$',
        },
        description: 'Capture every track on Soundcloud profile.',
        updated: '2019-06-24T15:09:02',
        fileName: 'soundcloudArtistBehavior.js',
      },
      url: 'https://soundcloud.com/perturbator',
      infoURL:
        'http://localhost:3030/info?url=https://soundcloud.com/perturbator',
      infoByNameURL: 'http://localhost:3030/info?name=soundCloudArtistBehavior',
      infoListURL:
        'http://localhost:3030/info-list?url=https://soundcloud.com/perturbator',
      infoListByNameURL:
        'http://localhost:3030/info-list?name=soundCloudArtistBehavior',
      behaviorURL:
        'http://localhost:3030/behavior?url=https://soundcloud.com/perturbator',
      behaviorByNameURL:
        'http://localhost:3030/behavior?name=soundCloudArtistBehavior',
    },
    {
      name: 'Soundcloud Embed',
      metadata: {
        name: 'soundCloudEmbedBehavior',
        match: {
          regex: '^https:\\/\\/w\\.soundcloud\\.com\\/player\\/.+',
        },
        description: 'Capture every track in the Soundcloud embed.',
        updated: '2019-06-24T15:09:02',
        fileName: 'soundcloudEmbedBehavior.js',
      },
      url:
        'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/598793067&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true',
      infoURL:
        'http://localhost:3030/info?url=https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/598793067&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true',
      infoByNameURL: 'http://localhost:3030/info?name=soundCloudEmbedBehavior',
      infoListURL:
        'http://localhost:3030/info-list?url=https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/598793067&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true',
      infoListByNameURL:
        'http://localhost:3030/info-list?name=soundCloudEmbedBehavior',
      behaviorURL:
        'http://localhost:3030/behavior?url=https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/598793067&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true',
      behaviorByNameURL:
        'http://localhost:3030/behavior?name=soundCloudEmbedBehavior',
    },
    {
      name: 'Twitter Hashtags',
      metadata: {
        name: 'twitterHashTagsBehavior',
        match: {
          regex:
            '^(?:https:\\/\\/(?:www\\.)?)?twitter\\.com\\/hashtag\\/[^?]+.*',
        },
        description:
          'Capture every tweet in hashtag search, including embedded videos, images and replies.',
        updated: '2019-07-10T10:32:26',
        fileName: 'twitterHashTagsBehavior.js',
      },
      url: 'https://twitter.com/hashtag/iipcwac18?vertical=default&src=hash',
      infoURL:
        'http://localhost:3030/info?url=https://twitter.com/hashtag/iipcwac18?vertical=default&src=hash',
      infoByNameURL: 'http://localhost:3030/info?name=twitterHashTagsBehavior',
      infoListURL:
        'http://localhost:3030/info-list?url=https://twitter.com/hashtag/iipcwac18?vertical=default&src=hash',
      infoListByNameURL:
        'http://localhost:3030/info-list?name=twitterHashTagsBehavior',
      behaviorURL:
        'http://localhost:3030/behavior?url=https://twitter.com/hashtag/iipcwac18?vertical=default&src=hash',
      behaviorByNameURL:
        'http://localhost:3030/behavior?name=twitterHashTagsBehavior',
    },
    {
      name: 'Twitter Timeline',
      metadata: {
        name: 'twitterTimelineBehavior',
        match: {
          regex:
            '^(?:https:[\\/]{2}(?:www[.])?)?twitter[.]com[\\/]?(?:[^\\/]+[\\/]?)?$',
        },
        description:
          'Capture every tweet, including embedded videos, images, replies and/or related tweets in thread.',
        updated: '2019-07-10T10:32:26',
        fileName: 'twitterTimelineBehavior.js',
      },
      url: 'https://twitter.com/webrecorder_io',
      infoURL:
        'http://localhost:3030/info?url=https://twitter.com/webrecorder_io',
      infoByNameURL: 'http://localhost:3030/info?name=twitterTimelineBehavior',
      infoListURL:
        'http://localhost:3030/info-list?url=https://twitter.com/webrecorder_io',
      infoListByNameURL:
        'http://localhost:3030/info-list?name=twitterTimelineBehavior',
      behaviorURL:
        'http://localhost:3030/behavior?url=https://twitter.com/webrecorder_io',
      behaviorByNameURL:
        'http://localhost:3030/behavior?name=twitterTimelineBehavior',
    },
  ],
  defaultBMD: {
    name: 'autoScrollBehavior',
    defaultBehavior: true,
    description:
      'Automatically scroll down the page and capture any embedded content. If more content loads, scrolling will continue until autopilot is stopped by user.',
    updated: '2019-07-10T10:32:26',
    fileName: 'autoscrollBehavior.js',
  },
  allResult: {
    url: 'http://localhost:3030/info-all',
    count: 13,
    value: {
      defaultBehavior: {
        name: 'autoScrollBehavior',
        defaultBehavior: true,
        description:
          'Automatically scroll down the page and capture any embedded content. If more content loads, scrolling will continue until autopilot is stopped by user.',
        updated: '2019-07-10T10:32:26',
        fileName: 'autoscrollBehavior.js',
      },
      behaviors: {
        deathImitatesLanguageBehavior: {
          name: 'deathImitatesLanguageBehavior',
          match: {
            regex:
              '^(?:https?:\\/\\/(?:www\\.)?)?deathimitateslanguage\\.harmvandendorpel\\.com\\/?$',
          },
          description:
            'Scrolls the page clicking all the images rendered at the current scroll level',
          updated: '2019-06-06T12:55:43',
          fileName: 'deathImitatesLanguageBehavior.js',
        },
        pinterestBehavior: {
          name: 'pinterestBehavior',
          match: {
            regex:
              '^(?:https:\\/\\/(:?www\\.)?)pintrest\\.com\\/[a-zA-Z]+[?].+',
          },
          description:
            'After login, automatically capture all pins on page and scroll down to load more if possible.',
          updated: '2019-06-24T15:09:02',
          fileName: 'pinterestBehavior.js',
        },
        slideShareBehavior: {
          name: 'slideShareBehavior',
          match: {
            regex:
              '^(?:https:\\/\\/(?:www\\.)?)slideshare\\.net\\/[a-zA-Z]+[?].+',
          },
          description:
            'Capture each slide contained in the slide deck. If there are multiple slide decks, view and capture each deck.',
          updated: '2019-06-24T15:09:02',
          fileName: 'slideShareBehavior.js',
        },
        youtubeVideoBehavior: {
          name: 'youtubeVideoBehavior',
          match: {
            regex: '^(?:https:\\/\\/(?:www\\.)?)?youtube\\.com\\/watch[?]v=.+',
          },
          description: 'Capture the YouTube video and all comments.',
          updated: '2019-06-24T15:09:02',
          fileName: 'youtubeVideoBehavior.js',
        },
        facebookNewsFeed: {
          name: 'facebookNewsFeed',
          match: {
            regex: '^https:\\/\\/(www\\.)?facebook\\.com(\\/)?([?]sk=nf)?$',
          },
          description:
            'Capture all items and comments in the Facebook timeline and scroll down to load more.',
          updated: '2019-06-25T16:16:14',
          fileName: 'facebookNewsFeedBehavior.js',
        },
        facebookUserFeed: {
          name: 'facebookUserFeed',
          match: {
            regex: '^https:\\/\\/(www\\.)?facebook\\.com\\/[^\\/]+\\/?$',
          },
          description:
            'Capture all items and comments in the Facebook page and scroll down to load more content where possible.',
          updated: '2019-06-25T16:16:14',
          fileName: 'facebookUserFeedBehavior.js',
        },
        instagramOwnFeedBehavior: {
          name: 'instagramOwnFeedBehavior',
          match: {
            regex: '^https:\\/\\/(www\\.)?instagram\\.com(?:\\/)?$',
          },
          description:
            'Capture all stories, images, videos and comments on the logged in users feed.',
          updated: '2019-07-15T22:29:05',
          fileName: 'instagramOwnFeedBehavior.js',
        },
        instagramPostBehavior: {
          name: 'instagramPostBehavior',
          match: {
            regex:
              '^https:\\/\\/(www\\.)?instagram\\.com\\/p\\/[^\\/]+(?:\\/)?$',
          },
          description:
            'Capture every image and/or video, retrieve all comments, and scroll down to load more.',
          updated: '2019-07-15T22:29:05',
          fileName: 'instagramPostBehavior.js',
        },
        instagramUserBehavior: {
          name: 'instagramUserBehavior',
          match: {
            regex:
              '^https:\\/\\/(www\\.)?instagram\\.com\\/[^\\/]+(?:\\/(?:[?].+)?(?:tagged(?:\\/)?)?)?$',
          },
          description:
            'Capture all stories, images, videos and comments on user’s page.',
          updated: '2019-07-15T22:29:05',
          fileName: 'instagramUserBehavior.js',
        },
        soundCloudArtistBehavior: {
          name: 'soundCloudArtistBehavior',
          match: {
            regex:
              '^(?:https:\\/\\/(?:www\\.)?)?soundcloud\\.com\\/(?!(?:discover|stream))[^\\/]+(?:\\/(?:tracks|albums|sets|reposts))?(?:\\/)?$',
          },
          description: 'Capture every track on Soundcloud profile.',
          updated: '2019-06-24T15:09:02',
          fileName: 'soundcloudArtistBehavior.js',
        },
        soundCloudEmbedBehavior: {
          name: 'soundCloudEmbedBehavior',
          match: {
            regex: '^https:\\/\\/w\\.soundcloud\\.com\\/player\\/.+',
          },
          description: 'Capture every track in the Soundcloud embed.',
          updated: '2019-06-24T15:09:02',
          fileName: 'soundcloudEmbedBehavior.js',
        },
        twitterHashTagsBehavior: {
          name: 'twitterHashTagsBehavior',
          match: {
            regex:
              '^(?:https:\\/\\/(?:www\\.)?)?twitter\\.com\\/hashtag\\/[^?]+.*',
          },
          description:
            'Capture every tweet in hashtag search, including embedded videos, images and replies.',
          updated: '2019-07-10T10:32:26',
          fileName: 'twitterHashTagsBehavior.js',
        },
        twitterTimelineBehavior: {
          name: 'twitterTimelineBehavior',
          match: {
            regex:
              '^(?:https:[\\/]{2}(?:www[.])?)?twitter[.]com[\\/]?(?:[^\\/]+[\\/]?)?$',
          },
          description:
            'Capture every tweet, including embedded videos, images, replies and/or related tweets in thread.',
          updated: '2019-07-10T10:32:26',
          fileName: 'twitterTimelineBehavior.js',
        },
      },
    },
  },
};
