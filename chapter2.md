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


2. named export metadata that is an object

3. named export **isBehavior**.

Details: **isBehavior** is a constant that you will flag as **true** when the behavior is complete and ready to be used. Otherwise, while the behavior is in progress, keep it as **false**.

Example of expected format:
`export const isBehavior = true;`





## Testing your first behavior

## Fixing a broken behavior

## Checking behavior status