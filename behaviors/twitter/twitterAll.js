function sleep(time) {
  return new Promise((resolve) => setTimeout(() => resolve(), time));
}


// ===========================================================================
class RestoreState {
  constructor(childMatchSelect, child) {
    this.matchValue = xpathString(childMatchSelect, child);
  }

  async restore(rootPath, childMatch) {
    let root = null;
    
    while (root = xpathNode(rootPath), !root) {
      await sleep(100);
    }

    return xpathNode(childMatch.replace("$1", this.matchValue), root);
  }
}


// ===========================================================================
class HistoryState {
  constructor(op) {
    this.loc = window.location.href;
    op();
  }

  get changed() {
    return window.location.href !== this.loc;
  }

  goBack(backButtonQuery) {
    if (!this.changed) {
      return Promise.resolve(true);
    }

    const backButton = xpathNode(backButtonQuery);

    return new Promise((resolve, reject) => {
      window.addEventListener('popstate', (event) => {
      resolve();
      }, {once: true});

      if (backButton) {
        backButton.click();
      } else {
        window.history.back();
      }
    });
  }
}


// ===========================================================================
function xpathNode(path, root) {
  root = root || document;
  return document.evaluate(path, root, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
}

function* xpathNodes(path, root) {
  root = root || document;
  let iter = document.evaluate(path, root, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
  let result = null;
  while (result = iter.iterateNext()) {
    yield result;
  }
}

function xpathString(path, root) {
  root = root || document;
  return document.evaluate(path, root, null, XPathResult.STRING_TYPE).stringValue;
}


// ===========================================================================
class TwitterTimeline
{
  constructor(maxDepth) {
    this.maxDepth = maxDepth || 0;

    this.rootPath = "//div[starts-with(@aria-label, 'Timeline')]/*[1]";
    this.anchorQuery = ".//article";
    this.childMatchSelect = "string(.//article//a[starts-with(@href, '/') and @title]/@href)";
    this.childMatch = "child::div[.//a[@href='$1']]";

    this.expandQuery = ".//div[@role='button' and @aria-haspopup='false']//*[contains(text(), 'more repl')]";
    this.quoteQuery = ".//div[@role='blockquote' and @aria-haspopup='false']";

    this.imageQuery = ".//a[@role='link' and @aria-haspopup='false' and starts-with(@href, '/') and contains(@href, '/photo/')]";
    this.imageNextQuery = "//div[@aria-label='Next']";
    this.imageCloseQuery = "//div[@aria-label='Close' and @role='button']";
    this.backButtonQuery = "//div[@aria-label='Back' and @role='button']";

    this.progressQuery = ".//*[@role='progressbar']";

    this.promoted = './/*[text()="Promoted"]';

    this.seenTweets = new Set();
    this.seenMediaTweets = new Set();

    this.state = {
      videos: 0,
      images: 0,
      threadsOrReplies: 0,
      viewedFully: 0
    };
  }

  getState(msg, incrValue) {
    if (incrValue && this.state[incrValue] != undefined) {
      this.state[incrValue]++;
    }

    return {state: this.state, msg};
  }

  async waitForNext(child) {
    if (!child) {
      return null;
    }

    await sleep(100);

    if (!child.nextElementSibling) {
      return null;
    }

    while (xpathNode(this.progressQuery, child.nextElementSibling)) {
      await sleep(100);
    }

    return child.nextElementSibling;
  }

  async expandMore(child) {
    const expandElem = xpathNode(this.expandQuery, child);
    if (!expandElem) {
      return child;
    }

    const prev = child.previousElementSibling;
    expandElem.click();
    await sleep(100);
    while (xpathNode(this.progressQuery, prev.nextElementSibling)) {
      await sleep(100);
    }
    child = prev.nextElementSibling;
    return child;
  }

  async* infScroll() {
    let root = xpathNode(this.rootPath);

    if (!root) {
      return;
    }

    let child = root.firstElementChild;

    if (!child) {
      return;
    }

    let count = 0;

    let text;

    while (child) {
      let anchorElem = xpathNode(this.anchorQuery, child);

      if (!anchorElem && this.expandQuery) {
        child = await this.expandMore(child, this.expandQuery, this.progressQuery);
        anchorElem = xpathNode(this.anchorQuery, child);
      }

      if (child && child.innerText) {
        child.scrollIntoView();      
      }

      if (child && anchorElem) {
        await sleep(100);

        const restorer = new RestoreState(this.childMatchSelect, child);

        if (restorer.matchValue) {
          yield anchorElem;

          child = await restorer.restore(this.rootPath, this.childMatch);
        }
      }

      child = await this.waitForNext(child, this.progressQuery);
    }
  }

  async* mediaPlaying(tweet) {
    const media = xpathNode("(.//video | .//audio)", tweet);
    if (!media || media.paused) {
      return;
    }

    let msg = "Waiting for media playback ";

    try {
      const mediaTweetUrl = new URL(xpathString(this.childMatchSelect, tweet.parentElement), window.location.origin).href;
      if (this.seenMediaTweets.has(mediaTweetUrl)) {
        return;
      }
      msg += "for " + mediaTweetUrl;
      this.seenMediaTweets.add(mediaTweetUrl);
    } catch (e) {

    }

    msg += "to finish...";

    yield this.getState(msg, "videos");

    const p = new Promise((resolve, reject) => {
      media.addEventListener("ended", () => resolve());
      media.addEventListener("abort", () => resolve());
      media.addEventListener("error", () => resolve());
      media.addEventListener("pause", () => resolve());
    });

    await p;
  }

  async* iterTimeline(depth = 0) {
    if (this.seenTweets.has(window.location.href)) {
      return;
    }

    yield this.getState("Capturing thread/timeline: " + window.location.href);

    // iterate over infinite scroll of tweets
    for await (const tweet of this.infScroll()) {
      // skip promoted tweets
      if (xpathNode(this.promoted, tweet)) {
        continue;
      }

      await sleep(500);

      // process images
      const imagePopup = xpathNode(this.imageQuery, tweet);

      if (imagePopup) {
        const imageState = new HistoryState(() => imagePopup.click());

        yield this.getState("Loading Image: " + window.location.href, "images");

        await sleep(500);

        let nextImage = null;
        let prevLocation = window.location.href;

        while (nextImage = xpathNode(this.imageNextQuery)) {
          nextImage.click();
          await sleep(200);

          if (window.location.href === prevLocation) {
            break;
          }
          prevLocation = window.location.href;

          yield this.getState("Loading Image: " + window.location.href, "images");
          await sleep(500);
        }

        await sleep(500);

        await imageState.goBack(this.imageCloseQuery);
      }

      // process quoted tweet
      const quoteTweet = xpathNode(this.quoteQuery, tweet);

      if (quoteTweet) {
        const quoteState = new HistoryState(() => quoteTweet.click());

        await sleep(100);

        yield this.getState("Capturing Quote: " + window.location.href);

        // wait
        await sleep(500);

        await quoteState.goBack(this.backButtonQuery);
        //tweet = await quoteState.restore(rootPath, childMatch);

        // wait before continuing
        await sleep(500);
      }

      // await any video or audio
      yield* this.mediaPlaying(tweet);


      // track location to see if click goes to new url
      const tweetState = new HistoryState(() => tweet.click());

      await sleep(100);

      if (tweetState.changed) {
        yield this.getState("Capturing Tweet: " + window.location.href);

        if (!this.seenTweets.has(window.location.href) && depth < this.maxDepth) {
          this.seenTweets.add(window.location.href);
          yield* this.iterTimeline(depth + 1, this.maxDepth);
        }

        // wait
        await sleep(500);

        await tweetState.goBack(this.backButtonQuery);
      }

      if (depth === 0) {
        this.state.viewedFully++;
      } else {
        this.state.threadsOrReplies++;
      }

      // wait before continuing
      await sleep(500);
    }
  }

  async* [Symbol.asyncIterator]() {
    yield* this.iterTimeline(0);
    yield this.getState("All Done!");
  }
}


export default async function* timelineIterator(cliApi) {
  yield* new TwitterTimeline(2);
}


export const metadata = {
  name: 'twitterTimelineBehavior',
  displayName: 'Twitter Timeline',
  match: {
    regex: /^(?:https?:[/]{2}(?:www[.])?)?twitter[.]com[/]?.*/,
  },
  description:
    'Capture every tweet, including quotes, embedded videos, images, replies and/or related tweets in thread.',
  updated: '2020-04-27T00:00:00Z',
};

export const isBehavior = true;
