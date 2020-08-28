# Chapter 2: Using Autopilot


## Creating your first behavior
A behavior is a [Javascript Module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) which executes a series of actions that collect some information (metadata) about a webpage. When creating a behavior, you should first take a look at the Pre-Made Behaviors on the Status Page <!-- add links to this once the Status Page is done -->. This will give you a basic idea of what kind of behaviors already have been created.

Once you have an idea of what you want your behavior to do, clone the webrecorder repository so that you can work locally on your computer.

1. `mkdir webrecorder` (or skip these two steps and use an already existing directory)
2. `cd webrecorder`
3. `git clone https://github.com/webrecorder/behaviors.git`

Next, make a file in the appropriate directory.

For example, if the behavior is specific to Facebook, put the file under the Facebook directory:

`touch webrecorder/facebook/myBehavior.js`

### Format
Every behavior has:

1. a **default export** that is an [async generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of#Iterating_over_async_generators) or a function returning an [async iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of#Iterating_over_async_generators). This is the function that will retrieve the metadata we want from the webpage.

```js
export detault async function* myBehavior(cliAPI){...}
```

More details on how the default export should be written can be found under the [Default Export](#default-heading) section.

2. an export named ***metadata*** that is an object

	Details: the ***metadata*** object gives information about the behavior, such as when it was last updated, whether it's functional, its display name, etc.

	Example of expected format:
```js
	export const metadata = { ... };
```

More details on how the metadata object should be written can be found under the [Metadata](#metadata-heading) section.

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

The export `postStep` can be called after each action to convert the yielded results into the [expected format](https://github.com/webrecorder/behaviors/blob/master/typedef/index.html#static-typedef-BehaviorStepResults).
<!-- The link for this is broken.-->

It is recommended that you use the library function [lib.buildCustomPostStepFn](https://github.com/webrecorder/behaviors/blob/master/function/index.html#static-function-buildCustomPostStepFn) if you want to perform some kind of action after each behavior step that is not directly tied to the running of the behavior.
<!-- The link for this is broken.-->

```js
export const postStep = lib.buildCustomPostStepFn(() => { ... });
```

###Metadata {#metadata-heading}
A behavior's exported metadata object is used to:

- describe how the behavior should be matched to the pages it is written for
- provide an overview of what the behavior does
- provide a more specific name associated with it when querying for it using the behavior api
- embed any additional information about the behavior

With those usages in mind, every metadata object is expected to have the following properties:

- name (string): the name for your behavior to be used when querying the behavior API for it by name
- description (string): a description of the behavior
- match (object): how the behavior will be matched to the page(s) it is written for




###Default Export (#default-heading)

## Testing your first behavior

## Fixing a broken behavior

## Checking behavior status