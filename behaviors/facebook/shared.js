export const storySelectors = {
  hyperFeedStory: 'div[id^=hyperfeed_story]',
  userStory: 'div[role="article"]',
};

export const buttonSelectors = {
  moreReplies: 'a[role="button"].UFIPagerLink',
  repliesToRepliesA: 'a[role="button"].UFICommentLink',
  spanReplies:
    'span.UFIReplySocialSentenceLinkText.UFIReplySocialSentenceVerified',
};

export const annoyingElements = {
  pageletGrowthId: 'pagelet_growth_expanding_cta',
};

export const elementIds = {
  userPostsTimelineMainCol: 'pagelet_timeline_main_column',
};

/**
 * @desc
 *
 * Queries:
 *  - feedItem: This xpath query is based on the fact that the first item in a FB news feed
 *   is fixed and all other feed items are lazily loaded.  Each lazily loaded feed item
 *   has `id="hyperfeed_story_id_5b90323a90ce80648983726"` but we do not care about
 *   the `_[a-z0-9]+` portion of it. Like how we handle twitter feeds, a visited it is
 *   marked by adding `$wrvisited$` to its classList so we look for elements with ids
 *  starting with `hyperfeed_story_id` and their classList does not contain `$wrvisited$`
 *
 *
 * @type {{userTimelineItem: string, feedItem: string}}
 */
export const xpathQueries = {
  feedItem:
    '//div[starts-with(@id,"hyperfeed_story_id") and not(contains(@class, "wrvistited"))]',
  userTimelineItem:
    '//div[contains(@class, "userContentWrapper") and not(contains(@class, "wrvistited"))]',
  repliesA:
    '//a[@role="button" and contains(@class, "UFICommentLink") and not(contains(@class, "wrvistited")) and not(contains(text(), "Write a comment"))]',
  subReplies:
    '//span[contains(@class, "UFIReplySocialSentenceLinkText") and not(contains(@class, "wrvistited")) and contains(text(), "Reply")] | //span[contains(@class, "UFIReplySocialSentenceLinkText") and not(contains(@class, "wrvistited")) and contains(text(), "Replies")]',
};

// hyperfeed_story_id_5c4f8af9e0bd66660400368

const repliesToRepliesSpan =
  'span.UFIReplySocialSentenceLinkText.UFIReplySocialSentenceVerified';
