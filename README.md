# DockerFile:
`Volume`: /dist (all built behaviors will be placed there)

# package.json scripts:
`build-prod`:
 - builds the production ready version (no-comments)

`build-docker`:
 - used by the docker file

`build-dev`:
 - runs dev build

`build-watch`:
 - runs dev build
 - auto-rebuild on changes
 - use env var BEHAVIOR_DIR have behaviors put somewhere other than ./dist

# build.js
args:
- `-a`: builds all behaviors
- `-f <file>`: build a specific file
- no args: cli choice of file to be watched and built :)