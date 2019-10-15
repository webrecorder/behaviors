export const PageletGrowthId = 'pagelet_growth_expanding_cta';
export const NewsFeedItemXPath =
  '//div[starts-with(@id,"hyperfeed_story_id") and not(contains(@class, "wrvistited"))]';
export const UserTimelineItemXPath =
  '//div[contains(@class, "userContentWrapper") and not(contains(@class, "wrvistited"))]';
export const TheaterItem = 'a[rel="theater"]';
export const TheaterId = 'photos_snowlift';
export const TheaterSelector = 'div[aria-label="Facebook Photo Theater"][role="dialog"]';
export const CloseTheater = 'a[href="#"]';
// hyperfeed_story_id_5c4f8af9e0bd66660400368

const repliesToRepliesSpan =
  'span.UFIReplySocialSentenceLinkText.UFIReplySocialSentenceVerified';

export const PlayVideoSelector = 'i > input[aria-label="Play video"]';
export const MoreCommentsSelector =
  'a[data-testid*="CommentsPagerRenderer/pager_depth"]';

export const UserFeedMore = '.clearfix.uiMorePager';
export const NewsFeedLoadingMore =
  'div[data-testid="fbfeed_placeholder_story"]';
export const NewsFeedPlaceHolderStory =
  'div[data-testid="fbfeed_placeholder_story"]';
