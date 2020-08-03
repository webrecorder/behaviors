module.exports = {
  tests: [
    {
      name: 'Autoscroll',
      metadata: {
        name: 'autoScrollBehavior',
        functional: true,
        displayName: 'Default Scrolling',
        defaultBehavior: true,
        description:
          'Default behavior for any page. Automatically scrolls down the page as much as possible. If additional content loads that increases page height, scrolling will continue until autopilot is stopped by user. Any discovered audio/video is played, but no other interactions are performed.',
        updated: '2019-08-21T14:52:23-07:00',
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
        updated: '2019-08-21T14:52:23-07:00',
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
        displayName: 'SlideShare',
        functional: true,
        match: {
          regex: '^(?:https?:\\/\\/(?:www\\.)?)slideshare\\.net\\/.+',
        },
        description:
          'Capture each slide contained in the slide deck. If there are multiple slide decks, view and capture each deck.',
        updated: '2019-08-21T14:52:23-07:00',
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
        displayName: 'Youtube',
        functional: true,
        match: {
          regex: '^(?:https?:\\/\\/(?:www\\.)?)?youtube\\.com\\/watch[?]v=.+',
        },
        description: 'Capture the YouTube video and all comments.',
        updated: '2019-08-21T14:52:23-07:00',
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
        displayName: 'Facebook Timeline',
        match: {
          regex: '^https?:\\/\\/(www\\.)?facebook\\.com(\\/)?([?]sk=nf)?$',
        },
        description:
          'Capture all items and comments in the Facebook timeline and scroll down to load more.',
        updated: '2019-08-21T14:52:23-07:00',
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
        displayName: 'Facebook Page',
        match: {
          regex: '^https?:\\/\\/(www\\.)?facebook\\.com\\/[^/]+\\/?$',
        },
        description:
          'Capture all items and comments in the Facebook page and scroll down to load more content where possible.',
        updated: '2019-08-21T14:52:23-07:00',
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
      name: 'Fulcrum Epub',
      metadata: {
        name: 'fulcrumEpubBehavior',
        displayName: 'Fulcrum Epub',
        functional: true,
        match: {
          regex: 'https?:\\/\\/(www\\.)?fulcrum\\.org\\/epubs\\/.+',
        },
        description: 'Views the content of an Epub',
        updated: '2019-09-23T17:19:38-04:00',
        fileName: 'fulcrumEpubsBehavior.js',
      },
      url:
        'https://www.fulcrum.org/epubs/b5644s18r?locale=en#/6/2[cover]!/4/1:0',
      infoURL:
        'http://localhost:3030/info?url=https://www.fulcrum.org/epubs/b5644s18r?locale=en#/6/2[cover]!/4/1:0',
      infoByNameURL: 'http://localhost:3030/info?name=fulcrumEpubBehavior',
      infoListURL:
        'http://localhost:3030/info-list?url=https://www.fulcrum.org/epubs/b5644s18r?locale=en#/6/2[cover]!/4/1:0',
      infoListByNameURL:
        'http://localhost:3030/info-list?name=fulcrumEpubBehavior',
      behaviorURL:
        'http://localhost:3030/behavior?url=https://www.fulcrum.org/epubs/b5644s18r?locale=en#/6/2[cover]!/4/1:0',
      behaviorByNameURL:
        'http://localhost:3030/behavior?name=fulcrumEpubBehavior',
    },
    {
      name: 'Instagram Own',
      metadata: {
        name: 'instagramOwnFeedBehavior',
        displayName: 'Instagram User Feed',
        functional: true,
        match: {
          regex: '^https?:\\/\\/(www\\.)?instagram\\.com(?:\\/)?$',
        },
        description:
          'Capture all stories, images, videos and comments on the logged in users feed.',
        updated: '2019-10-11T17:08:12-04:00',
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
        displayName: 'Instagram Post',
        functional: true,
        match: {
          regex: '^https?:\\/\\/(www\\.)?instagram\\.com\\/p\\/[^/]+(?:\\/)?$',
        },
        description:
          'Capture every image and/or video, retrieve all comments, and scroll down to load more.',
        updated: '2019-10-11T17:08:12-04:00',
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
        displayName: 'Instagram User Page',
        functional: true,
        match: {
          regex:
            '^https?:\\/\\/(www\\.)?instagram\\.com\\/[^/]+(?:\\/(?:[?].+)?(?:tagged(?:\\/)?)?)?$',
        },
        description:
          'Capture all stories, images, videos and comments on user’s page.',
        updated: '2019-10-11T17:08:12-04:00',
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
        displayName: 'Soundcloud Profile',
        functional: true,
        match: {
          regex:
            '^(?:https?:\\/\\/(?:www\\.)?)?soundcloud\\.com\\/(?!(?:discover|stream))[^/]+(?:\\/(?:tracks|albums|sets|reposts))?(?:\\/)?$',
        },
        description: 'Capture every track on Soundcloud profile.',
        updated: '2019-08-21T14:52:23-07:00',
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
        displayName: 'Soundcloud Embed',
        functional: true,
        match: {
          regex: '^https?:\\/\\/w\\.soundcloud\\.com\\/player\\/.+',
        },
        description: 'Capture every track in the Soundcloud embed.',
        updated: '2019-08-21T14:52:23-07:00',
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
      name: 'Twitter Timeline',
      metadata: {
        name: 'twitterTimelineBehavior',
        displayName: 'Twitter Timeline',
        functional: true,
        match: {
          regex: '^(?:https?:[/]{2}(?:www[.])?)?twitter[.]com[/]?.*',
        },
        description:
          'Capture every tweet, including quotes, embedded videos, images, replies and/or related tweets in thread.',
        updated: '2020-04-27T00:00:00Z',
        fileName: 'twitterTwitterAllBehavior.js',
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
    {
      name: 'Yahoo Groupconvomessages',
      metadata: {
        name: 'yahooGroupConvoMessagesBehavior',
        displayName: 'Yahoo Group Conversation Messages',
        functional: true,
        match: {
          regex:
            '^https?:\\/\\/(?:www\\.)?groups\\.yahoo\\.com\\/neo\\/groups\\/[^/]+\\/conversations\\/messages(?:[?].+)?$',
        },
        description: 'Views conversation messages of a Yahoo Group',
        updated: '2019-10-23T15:04:10-04:00',
        fileName: 'yahooGroupsConversationMessagesBehavior.js',
      },
      url:
        'https://groups.yahoo.com/neo/groups/extremeprogramming/conversations/messages',
      infoURL:
        'http://localhost:3030/info?url=https://groups.yahoo.com/neo/groups/extremeprogramming/conversations/messages',
      infoByNameURL:
        'http://localhost:3030/info?name=yahooGroupConvoMessagesBehavior',
      infoListURL:
        'http://localhost:3030/info-list?url=https://groups.yahoo.com/neo/groups/extremeprogramming/conversations/messages',
      infoListByNameURL:
        'http://localhost:3030/info-list?name=yahooGroupConvoMessagesBehavior',
      behaviorURL:
        'http://localhost:3030/behavior?url=https://groups.yahoo.com/neo/groups/extremeprogramming/conversations/messages',
      behaviorByNameURL:
        'http://localhost:3030/behavior?name=yahooGroupConvoMessagesBehavior',
    },
  ],
  defaultBMD: {
    name: 'autoScrollBehavior',
    functional: true,
    displayName: 'Default Scrolling',
    defaultBehavior: true,
    description:
      'Default behavior for any page. Automatically scrolls down the page as much as possible. If additional content loads that increases page height, scrolling will continue until autopilot is stopped by user. Any discovered audio/video is played, but no other interactions are performed.',
    updated: '2019-08-21T14:52:23-07:00',
    fileName: 'autoscrollBehavior.js',
  },
  allResult: {
    url: 'http://localhost:3030/info-all',
    count: 13,
    value: {
      defaultBehavior: {
        name: 'autoScrollBehavior',
        functional: true,
        displayName: 'Default Scrolling',
        defaultBehavior: true,
        description:
          'Default behavior for any page. Automatically scrolls down the page as much as possible. If additional content loads that increases page height, scrolling will continue until autopilot is stopped by user. Any discovered audio/video is played, but no other interactions are performed.',
        updated: '2019-08-21T14:52:23-07:00',
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
          updated: '2019-08-21T14:52:23-07:00',
          fileName: 'deathImitatesLanguageBehavior.js',
        },
        slideShareBehavior: {
          name: 'slideShareBehavior',
          displayName: 'SlideShare',
          functional: true,
          match: {
            regex: '^(?:https?:\\/\\/(?:www\\.)?)slideshare\\.net\\/.+',
          },
          description:
            'Capture each slide contained in the slide deck. If there are multiple slide decks, view and capture each deck.',
          updated: '2019-08-21T14:52:23-07:00',
          fileName: 'slideShareBehavior.js',
        },
        youtubeVideoBehavior: {
          name: 'youtubeVideoBehavior',
          displayName: 'Youtube',
          functional: true,
          match: {
            regex: '^(?:https?:\\/\\/(?:www\\.)?)?youtube\\.com\\/watch[?]v=.+',
          },
          description: 'Capture the YouTube video and all comments.',
          updated: '2019-08-21T14:52:23-07:00',
          fileName: 'youtubeVideoBehavior.js',
        },
        facebookNewsFeed: {
          name: 'facebookNewsFeed',
          displayName: 'Facebook Timeline',
          match: {
            regex: '^https?:\\/\\/(www\\.)?facebook\\.com(\\/)?([?]sk=nf)?$',
          },
          description:
            'Capture all items and comments in the Facebook timeline and scroll down to load more.',
          updated: '2019-08-21T14:52:23-07:00',
          fileName: 'facebookNewsFeedBehavior.js',
        },
        facebookUserFeed: {
          name: 'facebookUserFeed',
          displayName: 'Facebook Page',
          match: {
            regex: '^https?:\\/\\/(www\\.)?facebook\\.com\\/[^/]+\\/?$',
          },
          description:
            'Capture all items and comments in the Facebook page and scroll down to load more content where possible.',
          updated: '2019-08-21T14:52:23-07:00',
          fileName: 'facebookUserFeedBehavior.js',
        },
        fulcrumEpubBehavior: {
          name: 'fulcrumEpubBehavior',
          displayName: 'Fulcrum Epub',
          functional: true,
          match: {
            regex: 'https?:\\/\\/(www\\.)?fulcrum\\.org\\/epubs\\/.+',
          },
          description: 'Views the content of an Epub',
          updated: '2019-09-23T17:19:38-04:00',
          fileName: 'fulcrumEpubsBehavior.js',
        },
        instagramOwnFeedBehavior: {
          name: 'instagramOwnFeedBehavior',
          displayName: 'Instagram User Feed',
          functional: true,
          match: {
            regex: '^https?:\\/\\/(www\\.)?instagram\\.com(?:\\/)?$',
          },
          description:
            'Capture all stories, images, videos and comments on the logged in users feed.',
          updated: '2019-10-11T17:08:12-04:00',
          fileName: 'instagramOwnFeedBehavior.js',
        },
        instagramPostBehavior: {
          name: 'instagramPostBehavior',
          displayName: 'Instagram Post',
          functional: true,
          match: {
            regex:
              '^https?:\\/\\/(www\\.)?instagram\\.com\\/p\\/[^/]+(?:\\/)?$',
          },
          description:
            'Capture every image and/or video, retrieve all comments, and scroll down to load more.',
          updated: '2019-10-11T17:08:12-04:00',
          fileName: 'instagramPostBehavior.js',
        },
        instagramUserBehavior: {
          name: 'instagramUserBehavior',
          displayName: 'Instagram User Page',
          functional: true,
          match: {
            regex:
              '^https?:\\/\\/(www\\.)?instagram\\.com\\/[^/]+(?:\\/(?:[?].+)?(?:tagged(?:\\/)?)?)?$',
          },
          description:
            'Capture all stories, images, videos and comments on user’s page.',
          updated: '2019-10-11T17:08:12-04:00',
          fileName: 'instagramUserBehavior.js',
        },
        soundCloudArtistBehavior: {
          name: 'soundCloudArtistBehavior',
          displayName: 'Soundcloud Profile',
          functional: true,
          match: {
            regex:
              '^(?:https?:\\/\\/(?:www\\.)?)?soundcloud\\.com\\/(?!(?:discover|stream))[^/]+(?:\\/(?:tracks|albums|sets|reposts))?(?:\\/)?$',
          },
          description: 'Capture every track on Soundcloud profile.',
          updated: '2019-08-21T14:52:23-07:00',
          fileName: 'soundcloudArtistBehavior.js',
        },
        soundCloudEmbedBehavior: {
          name: 'soundCloudEmbedBehavior',
          displayName: 'Soundcloud Embed',
          functional: true,
          match: {
            regex: '^https?:\\/\\/w\\.soundcloud\\.com\\/player\\/.+',
          },
          description: 'Capture every track in the Soundcloud embed.',
          updated: '2019-08-21T14:52:23-07:00',
          fileName: 'soundcloudEmbedBehavior.js',
        },
        twitterTimelineBehavior: {
          name: 'twitterTimelineBehavior',
          displayName: 'Twitter Timeline',
          functional: true,
          match: {
            regex: '^(?:https?:[/]{2}(?:www[.])?)?twitter[.]com[/]?.*',
          },
          description:
            'Capture every tweet, including quotes, embedded videos, images, replies and/or related tweets in thread.',
          updated: '2020-04-27T00:00:00Z',
          fileName: 'twitterTwitterAllBehavior.js',
        },
        yahooGroupConvoMessagesBehavior: {
          name: 'yahooGroupConvoMessagesBehavior',
          displayName: 'Yahoo Group Conversation Messages',
          functional: true,
          match: {
            regex:
              '^https?:\\/\\/(?:www\\.)?groups\\.yahoo\\.com\\/neo\\/groups\\/[^/]+\\/conversations\\/messages(?:[?].+)?$',
          },
          description: 'Views conversation messages of a Yahoo Group',
          updated: '2019-10-23T15:04:10-04:00',
          fileName: 'yahooGroupsConversationMessagesBehavior.js',
        },
      },
    },
  },
};
