# Hacking Autopilot

## Contributing to Autopilot

We welcome contributions from anyone with beginning to advanced programming knowledge.

Please be advised that we have a [code of conduct](./code-of-conduct.md) that we expect all contributors to follow.

### Reporting bugs


## Tools of the Trade

### Advanced options

#### postStep
The export `postStep` can be called after each action to convert the yielded results into the expected format.

It is recommended that you use the library function `lib.buildCustomPostStepFn`if you want to perform some kind of action after each behavior step that is not directly tied to the running of the behavior.

```js
export const postStep = lib.buildCustomPostStepFn(() => { ... });
```

#### Metadata export: match
If you want to compare your URL to multiple sub URLs, you can use a different version of `match`. This version is shown below, and has the two properties `base` (RegExp) and `sub` (Array).

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
## Testing a behavior (Debugging)
Blocked by PR 63
## Behaviors
In pre made behaviors file
## Build System
## CLI
write docs on npm or yarn scripts
revamp the cli as scripts package.json scripts
<!-- ## Overview on Behaviors -->
## Provided CLI Commands
## Behavior Standard Library Reference
<!-- This is just API? -->