# Behaviors

## Format

A behavior is simply a JavaScript file that exposes the means to perform its series of actions in a page and some information (metadata) about itself.

With this in mind, every behavior is expected to be [JavaScript module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) that

- has a **default export** that is an [async generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of#Iterating_over_async_generators) or a function returning an [async iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator)
- has named export **metadata** that is an object
- has named export **isBehavior**

An example of the expected format behavior is shown below

```js
// means to perform the series of  actions
export default async function* myBehavior(cliAPI) { ... }

// information about the behavior
export const metadata = { ... };

// flag indicating this file is a behavior ready to be used
export const isBehavior = true;

// optional function to be called after each step of the behavior
export function postStep(rawBehaviorStepResults) { ... }
```

In the example above, the behavior exposes the means to perform its actions using the `export default` keywords.

The `export default` keywords indicate that whatever follows is the primary export of the module and what ever is default export of a behavior is used to run the behavior.

Any additional information that the behavior wishes to be expose using the `export` keyword and is shown in the example above with the final two required named exports **metadata** and **isBehavior**.

Please note that **isBehavior** named export is used to indicate that this behavior is ready to be used.

If the **isBehavior** export is missing then the provided tools will not recognize the behavior as being ready and will not use the behavior.

Likewise, if the behavior does not have a default export and does not export **metadata** and **isBehavior**, the tools will not consider the behavior as valid.

The optional export `postStep` is a function called after each action (step) of the behavior to convert the yielded results into the [expected format](../typedef/index.html#static-typedef-BehaviorStepResults).

It is recommended that you use the library function [lib.buildCustomPostStepFn](../function/index.html#static-function-buildCustomPostStepFn) if you want to perform some kind of action after each behavior step that is not directly tied to the running of the behavior.

```js
export const postStep = lib.buildCustomPostStepFn(() => { ... });
```

## Metadata

A behaviors exported metadata is used to

- describe how it should be matched to the pages it is written for
- provide an overview of what it does
- have a more specific name associated with it when querying for it using the behavior api
- embed any additional information about the behavior

And every exported metadata object is expected to have the following properties

- name (string): the name for your behavior to be used when querying the behavior API for it by name
- description (string): a description for the behavior
- match (object): how the behavior will be matched to the page(s) it is written for

Of the expected metadata properties, the match object has two variations and is shown below in the context of two valid metadata exports.

```js
// variation 1
export const metadata = {
  name: 'the name of your behavior',
  match: {
    regex: /an regular expression dictating the URL the behavior will run on/,
  },
  description: 'an description of what your behavior does',
};
```

The first variation, shown above, defines a single property `regex` that is an JavaScript [RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp).

The behavior using variation one is considered matched to an URL when the regular expression, defined in the `regex` property of `match`, matches the URL.

The second variation, shown below, has two properties `base` (RegExp) and `sub` (Array<RegExp>).

The `base` regular expression is used as a generic test and if it matches a URL the regular expressions in the `sub` array will be tested against the same URL.

The behavior is considered matched to a URL when the `base` regular expression matches the URL and one of the `sub` regular expressions also matches the URL.

```js
// variation 2
export const metadata = {
  name: 'the name of your behavior',
  match: {
    regex: {
      base: /an regular expressions dictating the base URL the behavior will run on/,
      sub: [
        /an array of regular expressions dictating more specific parts of the base URL the behavior will run on/,
      ],
    },
  },
  description: 'an description of what your behavior does',
};
```

## Behavior Implementation Overview

The primary reasons that a behaviors **default export** is required to be an [async generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of#Iterating_over_async_generators) or a function returning an [async iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator) are

- Async generators are a native JavaScript feature cross the major browser
- They provide a simple way to run the behavior via in the browser and via [browsertrix](https://github.com/webrecorder/browsertrix)
- Allow information about the behavior, its state, to be easily reported to behavior runners

However we understand this requirement, namely behaviors as async generators, may be a new JavaScript idiom for some and for the remaining portion of this section give a high level overview on how to write a behavior under this requirement.

Now consider the following example shown below which is a behavior living in the in the "behaviors" directory of this project for all pages of myAwesomeWebSite.com.

Please note that there is no code in the body of the `myBehavior` function, this is ok as all the remaining code examples should be assumed to be inside function where the comment "behavior code" is currently.

Also note that their exists a cli command for [new behavior creation](./cli.html#new-behavior-command) that will fill out much of the boiler plate shown in the code section below


```js
import * as lib from '../lib';

export default async function* myBehavior(cliAPI) {
  // behavior code
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

As you will have already noticed by looking over the documentation for the [behaviors standard library](../identifiers.html) that many of the functions returns [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

Now without turning into a JavaScript tutorial the only thing you need to know about promises is that they can be awaited, that is to say you can await for their completion.

This comes in handy when you want to wait for the the documents state to become ready since the pages of myAwesomeWebSite.com take a long time to load and can be done as easily as shown in `step 1`

```js
// step 1
await lib.domCompletePromise();
```

Now we know that the browser has fully parsed the page and we can safely start operating on the page.

But first we should let ourselves know that we are good to go by reporting some state and is done by yielding a value as shown in `step 2`

```js
// step 1
await lib.domCompletePromise();
// step 2
const state = { videosPlayed: 0 };
yield lib.stateWithMsgNoWait('Document ready!', state);
```

The function `lib.stateWithMsgNoWait` indicates to the behavior runner that the behavior has an updated to report and that it does not have to wait.

If the behavior was being run by [browsertrix](https://github.com/webrecorder/browsertrix) and the other function `lib.stateWithMsgWait` was used, browsertrix would have waited until the HTTP requests made by the page had died down (no request made for set period of time) but since we use the no wait variant we know no wait will be made.

When you `yield` a value from the behavior you can consider the behavior paused until the runner initiates an the next action.

If a wait was indicated using the `lib.stateWithMsgWait` and the behavior is being run by browsertrix no more actions would be initiated until the pages network (amount of HTTP requests made) become idle (no more requests made for a set period of time).

Additionally, it should be noted that the second argument supplied to `lib.stateWithMsgNoWait` is optional but useful for reporting to yourself more detailed information about the state of your behavior.

Continuing on with the creation of our behavior, let us assume that the page that the behavior is operating in has a list videos we want to play.

We can accomplish this as shown in `step 3`

```js
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
```

In step three we use the function `childElementIterator` that returns an iterator over the child elements of the supplied parent element and then for each child of the element with `id="videos" we
  * select the video element that is a descendant of the `videoListItem`s and play the video
  * increment the number of videos played in our behaviors state
  * let ourselves know that we played a video


Also seen in step 3 is the usage keyword `yield` in combination with `*` or `yield *`.

`yield *` means that we are yielding another generator, that is to say all actions of the generator are to be treated as if we yielded them ourselves.

In short step 3 can be described as playing a video contained in every child of the element with id == video and once we have played all the videos on the page return a message with our final state from the behavior.

This completes the mini-tutorial on how to create behaviors.

The full behavior is shown below

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

## Development Workflow

### Automated

The simplest way to both develop and run a behavior on the target page is to use the provided behavior runner cli and a run configuration file ([more details](./cli.html#runner-command)).

To help you get started a behavior run configuration file, `behavior-run-config.yml` found at the root of this project, has been provided for you.

By using the provided configuration file all that is required is to change two fields:

- behavior: the path to your new behavior in the behavior directory of this project
- url: the url of the page your behavior should be run in

Once you have changed those two you fields you can start the build and run process by either executing one of the following from the root directory of this project

 - `./bin/cli runner -c behavior-run-config.yml`
 - `./bin/cli-runner -c behavior-run-config.yml`

The command will launch a Chrome/Chromium browser installed on your computer, build the behavior, and then run it until completion.

While the behavior is being run or the behavior has run to completion and a change has been detected to the behavior 
or any of the files it includes, it will be rebuilt and re-run automatically.

### Manual

To build the behavior execute the following command `./bin/cli-behaviors -b ./behaviors/<path to your behavior>`.
Once the command exits the behavior ready to be run can be found at `./dist/<behavior name>.js` or you can copy the path displayed
in the output of the build command.

The next step is to copy the contents of the generated file into the browser and run it.

The generated file contains JavaScript that will setup the behavior for running using an utility class exposed on `window` as `$WBBehaviorRunner$`.

Shown below are the ways provided for you to manually run the behavior by the utility class.

```js
/* automatic running, chose 1 method */
(async () => {
  for await (const state of $WBBehaviorRunner$.autoRunIter()) { 
    console.log(state); 
  }

  /* or */ 
  await $WBBehaviorRunner$.autoRun({logging: true});
  
  /* or */ 
  await $WBBehaviorRunner$.autoRunWithDelay({logging: true});
})();

/* manually initiate each step of the behavior */
(async () => {
  while (true) {
    const state  = await $WBBehaviorRunner$.step();
    console.log(state);
    if (state.done) break;
  }
})();
```

The `autoRunIter` function accepts a single optional argument delayAmount (number), which is a time value in milliseconds that will be applied after each action (step) of the behavior.

Both the `autoRun` and `autoRunWithDelay` methods accept a single optional argument options (object) with one exception, `autoRunWithDelay` defaults to applying a one second delay after each action if no delay was specified.

The full configuration options for these two methods are displayed below 
  - delayAmount (number, defaults to 1000):  Time value in milliseconds representing how much time should be waited after initiating a behavior's step
  - noOutlinks (boolean, defaults to true): Should the collection of outlinks be disabled when running the behavior
  - logging (boolean, defaults to true): Should information the behavior sends be displayed

If you use one of the three way to "automatically" run the behavior and you wish to pause it while it is running set `window.$WBBehaviorPaused` to true and to un-pause it set `window.$WBBehaviorPaused` to false.
