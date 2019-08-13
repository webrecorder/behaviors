# Pre-made Behaviors

## Autoscroll

### Applies to

Pages that do not have a predefined behavior for them

### Behavior
Automatically scroll down the page and captures any embedded content. If more content loads, scrolling will continue until autopilot is stopped by user.

### Specifics

The discovery of media is done by considering the rendered HTML of page at the current scroll position and the playing of the discovered media is done using [operations](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play) defined for HTML media elements. If the page requires a more specific action to be performed in order to play its media, the behavior may fail to play the media and in this case, a more specific behavior should be made in order to handle this condition.


## Instagram

### Gotchas
Instagram changes their CSS class names frequently which can potentially cause the behaviors to not be able to view/play media content until they are updated.

Video posts require application logic to be played consistently.
Gifs are shown via the video element and actual videos are streamed. 

*Note data request politeness (1 img = 4 requests)*

### Stories
Requires the viewer to be logged in

Logged in state detected if the “logged-in” CSS class is present or the login/sign-up element are not present 

### User (not own feed)
Updated: 2019-07-15T22:29:05

#### Applies to
- `https://(www.)instagram.com/[user name](/)`
- `https://(www.)instagram.com/[user name](/?query-string)`
- `https://(www.)instagram.com/[user name](/tagged)(/)`

#### Behavior

- View stories if able
- View each post currently visible
- If not stopping condition: wait for more rows indefinitely*

#### Viewing stories

As previously mentioned, a logged in user. 
If there are selected stories (profile picture is clickable) they are viewed first 
If there are normal stories to be viewed they are viewed

#### Viewing posts

Video post (gif, traditional video)
- video is played and a wait for the user agent to determine if the video can play through all the way is done

Photo post
 - no “special” action other than view

Multiple media post
 - each part of the multi-post is viewed 
 - if video media is contained the video post action is performed before moving to the next part 
 - otherwise photo post action is performed

All post types
 - all comments and replies to comments are loaded

#### Stopping condition
Since instagram is a react application we attempt to extract the “redux store” in order to determine the number of posts by the user and to listen for application state changes that indicate if there are additional “pages” (more posts) to be retrieved.

If extraction of the “redux store” fails or application internals have changed we fall back to a rudimentary post counting scheme.
When not using store the wait for more post rows to be rendered is limited to 1 minute

The completion condition can be expressed as follows
Store extraction has not failed: There are no more pages to be retrieved and the current row of posts does not have a next sibling
Store extraction failed: The number of posts viewed is >= number of posts by the user and the current row of posts does not have a next sibling



### Individual Post

#### Applies to
 - `https://(www.)instagram.com/p/[post-id](/)`

Behavior
The actions of this behavior are described in the Viewing posts section of the Instagram User behavior


### Own Feed

**Note**: Requires logged in viewer

Unlike viewing of some other users posts the viewing of own feed posts is limited due to instagram not displaying the viewed post in a popup rather you are taken to post page

#### Applies to
- `https://(www.)instagram.com(/)`

#### Behavior

View stories if any are to be had

For each rendered post: 
  - perform actions described in the Viewing posts section of the Instagram User behavior with one exception, comments cannot be viewed
 If stopping condition not met wait for more posts to be loaded at maximum 45 seconds

#### Stopping condition
 
The currently viewed post has no next sibling after 45 seconds

## Twitter

### Gotchas
Tweet embeds although sometimes viewable inline by clicking on them are shown using an iframe that the behavior does not have access to 

Audio video tweets are streamed and if the media is of significant length waiting for them to become fully loaded may take the entire length of the video or a significantly long period of time (5+ minutes)

### Timeline
Applies to
 - `https://(www.)twitter.com(/)`  -- Note this requires logged in
 - `https://(www.)twitter.com/[user-name](/)`

#### Behavior
If the viewed page is marked as sensitive, reveal page

For each rendered tweet
  - If tweet marked as sensitive reveal it
  - If tweet has video play it

Open tweet
 - If tweet has replies or apart of thread view comments thread parts

If stopping condition is not met wait for more tweets to be loaded
 
#### Stopping condition
The currently viewed tweet does not have a sibling and the pre-rendered stream end or stream failed are made visible


### HashTags

#### Applies to
 - `https://(www.)twitter.com/hashtag/[hash-tag](remaining-URL-parts)*`

#### Behavior
For each rendered tweet
 - If tweet marked as sensitive reveal it
 - If tweet has video play it
 - Open tweet
   - If tweet has replies or apart of thread view comments thread parts

If stopping condition is not met wait for more tweets to be loaded and repeat

#### Stopping condition
The currently viewed tweet does not have a sibling and the pre-rendered stream end or stream failed are made visible


## Youtube Video

### Applies to
 - https://(www.)youtube.com/watch?v=[remaining-URL-parts]+  

### Behavior
Loads the videos additional information

Plays the video

Clicks show more replies until all replies have been loaded (if there were replies)

