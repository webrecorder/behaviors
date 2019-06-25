import postIterator from './sub';

export default postIterator;

export const metaData = {
  name: 'redditTimelineBehavior',
  description: 'Capture all posts on reddits main page.',
  match: {
    regex: /^https:\/\/(www\.)?reddit\.com(?:(?:\/[a-z]{3, }\/?)|(?:\/))?$/,
  },
};

export const isBehavior = true;
