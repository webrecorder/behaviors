# Chapter 2: Creating your first behavior

A behavior is a [Javascript Module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) which executes a series of actions that collect some information (metadata) about a webpage. Before you create your first behavior, you should first take a look at the Pre-Made Behaviors on the Status Page<!-- add links to this once the Status Page is done -->. This will give you a basic idea of what kind of behaviors have already been created.

## Setting up your file
Once you have an idea of what you want your behavior to do, clone the webrecorder repository so that you can work locally on your computer.

1. `mkdir webrecorder` (or skip steps 1-2 and use an already existing directory)
2. `cd webrecorder`
3. `git clone https://github.com/webrecorder/behaviors.git`
4. `cd behaviors`

You should also download a package manager like yarn or npm, and make sure that you are using the correct version.
```
$ yarn install
# or "npm install"
```

To check your version of npm, type the command `npm --version`. You can check the [npm website](https://www.npmjs.com/package/npm?activeTab=versions) to see what the latest version is.

You should also check to make sure that your version of node is 12 or above.

### Getting started using the CLI

You should now create a Javascript file for your new behavior. You can do this using the CLI.

The `newBehavior` command provides a simple way to create a new behavior by generating a new file in the behavior directory containing the required boiler plate.

Executing `./bin/cli newBehavior awesomeBehavior` will create a new behavior file `awesomeBehavior.js` located in the behavior directory.


### Format



Every behavior has:

1. a **default export** that is an [async generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of#Iterating_over_async_generators) or a function returning an [async iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of#Iterating_over_async_generators). This is the function that will retrieve the metadata we want from the webpage.

```js
export detault async function* myBehavior(cliAPI){...}
```

More details on how the default export should be written can be found under the [Default Export](#default-export) section.

2. an export named ***metadata*** that is an object

	Details: the ***metadata*** object gives information about the behavior, such as when it was last updated, whether it's functional, its display name, etc.

	Example of expected format:
```js
	export const metadata = { ... };
```

More details on how the metadata object should be written can be found under the [Metadata](#metadata) section.

3. an export named **isBehavior**.

	Details: **isBehavior** is a constant that you will flag as **true** when the file is complete and ready to be used. Otherwise, while the file is still in progress, keep it as **false**.

	Example of expected format:
```js
export const isBehavior = true;
```
<!-- Need to clarify what isBehavior does, because it says "If the isBehavior export is missing
then the provided tools will not recognize the behavior as being ready and will not use the behavior."
But I think it makes more sense to say that marking it as false shows that the behavior is not ready
to use.
 -->

It's important to note that the tools will not recognize that the behavior is ready for use and valid if any of these three main components (the default export, **isBehavior**, and **metadata**) are missing.

The export `postStep` can be called after each action to convert the yielded results into the expected format.

It is recommended that you use the library function `lib.buildCustomPostStepFn`if you want to perform some kind of action after each behavior step that is not directly tied to the running of the behavior.

```js
export const postStep = lib.buildCustomPostStepFn(() => { ... });
```

### Metadata (#metadata-heading)
A behavior's exported metadata object is used to:

- describe how the behavior should be matched to the pages it is written for
- provide an overview of what the behavior does
- provide a more specific name associated with it when querying for it using the behavior api
- embed any additional information about the behavior

With those usages in mind, every metadata object is expected to have the following properties:

- **name** (string): the name for your behavior to be used when querying the behavior API for it by name
- **description** (string): a description of the behavior
- **match** (object): how the behavior will be matched to the page(s) it is written for

The **match** object has two variations and is shown below in the context of two valid metadata exports.

```js
// variation 1
export const metadata = {
  name: 'the name of your behavior',
  match: {
    regex: /a regular expression dictating the URL the behavior will run on/,
  },
  description: 'an description of what your behavior does',
};
```
The first variation of `match`, shown above, defines a single property `regex` that is an JavaScript [RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp). The behavior using variation one is considered matched to an URL when the regular expression, defined in the `regex` property of match, matches the URL.


The second variation of `match`, shown below, has the two properties `base` (RegExp) and `sub` (Array).

The `base` regular expression is used as a generic test. If `base` matches a URL, the regular expressions in the `sub` array will be tested against the same URL. The behavior is considered matched to a URL when the `base` regular expression matches the URL and one of the `sub` regular expressions also matches the URL.



```js
// variation 2
export const metadata = {
  name: 'the name of your behavior',
  match: {
    regex: {
      base: /a regular expression dictating the base URL the behavior will run on/,
      sub: [
        /an array of regular expressions dictating more specific parts of the base URL the behavior will run on/,
      ],
    },
  },
  description: 'a description of what your behavior does',
};
```



### Default Export(#default-heading)

#### Asyncronous Generator Functions

The purpose of an [asyncronous generator function](https://thecodebarbarian.com/async-generator-functions-in-javascript.html#:~:text=Async%20generator%20functions%20behave%20similarly,()%20function%20returns%20a%20promise.) is to collect data from a source that has too much data to return all at once (or would take too long to return all at once). Instead, the generator is a function that returns an object with a next() method on it. The programmer can keep calling next() until all of the data is received. An asynchronous generator function uses promises for the same purpose (promises will be expanded upon in the following section).

The primary reasons that a behavior's **default export** is required to be an async generator function or a function returning an [async iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator) are:

- async generators are widely supported in Javascript
- they provide a simple way to run the behavior in the browser or through [browsertrix](https://github.com/webrecorder/browsertrix)
- they allow information about the behavior and its state to be easily retrieved by code executing the behavior

Consider the following example:

```js
import * as lib from '../lib';

export default async function* myBehavior(cliAPI) {
  // behavior code will be developed here
}

export const metadata = {
  name: 'myBehavior',
  match: {
    regex: /^(?:https?:\/\/(?:www\.)?)?:myAwesomeWebSite.com.*$/,
  },
  description: 'It does really cool stuff',
};

export const isBehavior = true;
```

In this example, `myBehavior` is an asynchronous generator function that's being exported for our behavior and this behavior would work for any website with myAwesomeWebSite.com in its name (notice the regex for the matching above). Much of this boiler plate code shown above has been generated automatically by the cli command
`./bin/cli newBehavior [behaviorName]`.

#### Promises

Next, you may have notticed looking over some of the behavior documentation that many of the functions return [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

Now, without turning into a JavaScript tutorial, the only thing you need to know about promises is that they can be awaited, that is to say you can await for their completion.

This comes in handy when you want to wait for the the document's state to become ready since the pages of myAwesomeWebSite.com take a long time to load and can be done as easily as shown in `step 1`. This is the beginning of the code that will go in the default async function.

```js
// step 1, wait for the page to complete loading
await lib.domCompletePromise();
```

Now that we know the browser has fully loaded the page, we can safely start executing behaviors on the page.

The next step is to initialize our state and report it, which is done by yielding a value as shown in `step 2`, where state contains the number of videos played.

```js
// step 2, initialize state and return it
const state = { videosPlayed: 0 };
yield lib.stateWithMsgNoWait('Document ready!', state);
```

The function `lib.stateWithMsgNoWait` indicates to the code executing the behavior that it has an update to report and that it does not have to wait.

If the behavior was being run by [browsertrix](https://github.com/webrecorder/browsertrix) and the other function `lib.stateWithMsgWait` was used, browsertrix would have waited until the HTTP requests made by the page had significantly slowed down (no request made for set period of time) before executing further code in the function. However, since we use the *no wait* variant, the behavior will immediately return state.

When you `yield` a value from the behavior you can consider the behavior paused until the runner initiates the `next()` action.

Additionally, it should be noted that the second argument supplied to `lib.stateWithMsgNoWait` is optional but useful for reporting to yourself more detailed information about the state of your behavior.

Continuing on with the creation of our behavior, let us assume that the page that the behavior is operating in has a list of videos we want to play. Our behavior will generate the next video to play each iteration.

We can accomplish this as shown in `step 3`.

```js
// step 3
for (const videoListItem of lib.childElementIterator(lib.id('videos'))) {
  // videoListItem is a child of the element with id == 'videos'
  // that has a video as child element
  const videoWasPlayed = await lib.selectAndPlay('video', videoListItem);
  if (videoWasPlayed) {
    // increment our states counter for number of videos played
    state.videosPlayed += 1;
    // let ourselves know we played a video
    yield lib.stateWithMsgNoWait('Played a video!', state);
  } else {
    yield lib.stateWithMsgNoWait('Failed to play a video using the standard DOM methods', state);
  }
}
return lib.stateWithMsgNoWait('Done!', state);
```

In `step 3` we use the function `childElementIterator` that returns an iterator over the child elements of the supplied parent element. Then for each child of the element with `id="videos"` we:

- select the video element that is a descendant of the `videoListItems` and play the video
- increment the number of videos played in our behavior's state
- let ourselves know that we played a video

Also seen in `step 3` is the usage keyword `yield*`.

`yield*` means that we are yielding another generator, that is to say all actions of the generator are to be treated as if we yielded them ourselves.

In short, `step 3` can be described as playing a video contained in every child of the element with `id == video`, and once we have played all the videos on the page return a message with our final state from the behavior.

The full behavior is shown below:

```js
import * as lib from '../lib';

export default async function* myBehavior(cliAPI) {
  // behavior code
  // step 1
  await lib.domCompletePromise();
  // step 2
  const state = { videosPlayed: 0 };
  yield lib.stateWithMsgNoWait('Document ready!', state);
  // step 3
  for (const videoListItem of lib.childElementIterator(lib.id('videos'))) {
    // videoListItem is a child of the element with id == 'videos'
    // that has a video as child element
    const videoWasPlayed = await lib.selectAndPlay('video', videoListItem);
    if (videoWasPlayed) {
      // increment our states counter for number of videos played
      state.videosPlayed += 1;
      // let ourselves know we played a video
      yield lib.stateWithMsgNoWait('Played a video!', state);
    } else {
      yield lib.stateWithMsgNoWait('Failed to play a video using the standard DOM methods', state);
    }
  }
  return lib.stateWithMsgNoWait('Done!', state);
}

export const metadata = {
  name: 'myBehavior',
  match: {
    regex: /^(?:https?:\/\/(?:www\.)?)?:myAwesomeWebSite.com.*$/,
  },
  description: 'It does really cool stuff',
};

export const isBehavior = true;
```

## Testing your first behavior

Blocked by [PR 63](https://github.com/webrecorder/behaviors/pull/63)

You should use the runner CLI to test your behavior. The runner command allows you to automatically run a behavior on a specified URL using a Chrome/Chromium browser installed on your machine.

`$ ./bin/cli help runner`

Please note that in order to provide automatic running of behaviors, this command must be able to launch the Chrome/Chromium browser. In other words, an already running instance of Chrome/Chromium can not be used.

First, you will need to create a config file (yaml format) to use the runner. An example run config is provided for you and can found in the root of this project (`behavior-run-config.yml`).

By using the example configuration file [`behavior-run-config.yml`](./behavior-run-config.yml) all that you have to do is change two fields:

- behavior: the path to your new behavior in the behavior directory of this project
- url: the url of the page your behavior should be run in


The simplest way to use the runner is through the usage of a config file (yaml format) and can be supplied using the -c or --config flags like so:

`./bin/cli runner -c <path to run config.yaml>`.




## Fixing a broken behavior

If a behavior is broken

## Checking behavior status

how do you check behavior status and is this done in js


