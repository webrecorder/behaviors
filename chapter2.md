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

1. a **default export** that is an [async generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of#Iterating_over_async_generators) or a function returning an [async iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of#Iterating_over_async_generators).

```js
export detault async function* myBehavior(cliAPI){...}
```

2. named export ***metadata*** that is an object

	Details: the ***metadata*** object gives information about the behavior. In this object you should include the data about the name, whether it's functional, the display name, whether it's a default behavior, a description about the behavior, and when it was last updated.

	Example of expected format, taken from the [autoscroll behavior](https://github.com/webrecorder/behaviors/blob/master/behaviors/autoscroll.js):
```js
export const metadata = {
  name: 'autoScrollBehavior',
  functional: true,
  displayName: 'Default Scrolling',
  defaultBehavior: true,
  description:
    'Default behavior for any page. Automatically scrolls down the page as much as possible. If additional content loads that increases page height, scrolling will continue until autopilot is stopped by user. Any discovered audio/video is played, but no other interactions are performed.',
  updated: '2019-08-21T14:52:23-07:00',
};
```

3. named export **isBehavior**.

	Details: **isBehavior** is a constant that you will flag as **true** when the file is complete and ready to be used. Otherwise, while the file is still in progress, keep it as **false**.

	Example of expected format:
```js
export const isBehavior = true;
```





## Testing your first behavior

## Fixing a broken behavior

## Checking behavior status