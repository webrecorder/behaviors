# Chapter 1


## What is web archiving?

Web archiving is the process of recording web resources. Various elements of the website such as HTML, scripts, images, videos, etc. can be recorded to preserve as much of the original resource as possible. By creating dynamic archives that provide a user with the same experience they would have if they accessed the original site, web archives can give much more information than a static screenshot.

Web archives may be utilized by future researchers, historians and the general public.

## Why Autopilot?

Autopilot is a tool that navigates a website similarly to how a human would, doing things like scrolling, clicking buttons, and playing videos. These actions executed through functions called "behaviors." Because Autopilot can go through the technically complicated aspects of a website, it is useful for recording high-fidelity websites. Furthermore, Autopilot is designed to be accessible for anyone to use, and anyone with little javascript knowledge to contribute to. This makes webarchiving available to everyone.

## Installing Autopilot

To use this project you must first install its dependencies. You can do this via a package manager like [Yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable) or [npm](https://www.npmjs.com/).

```
$ yarn install
# or "npm install"
```

If you wish to use this project via Docker, install [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/).

To install Autopilot, use Terminal to clone the Webrecorder repository:
```
1. git clone https://github.com/webrecorder/behaviors.git
2. cd autopilot; bash init-default.sh.
3. docker-compose build
4. docker-compose up -d
```

The Autopilot instance can be accessed in the browser at `http://localhost:8089`.


# Autopilot basics
Autopilot uses [behaviors](https://github.com/webrecorder/behaviors/blob/master/manual/behaviors.md) to collect metadata from websites. Behaviors are Javascript modules which perform a series of actions on a webpage in order to collect information.


The cli provides two commands API and behaviors and each command has its own options.

## Behaviors command

Execute `./bin/cli behaviors -b` to build the behaviors made available, using the config file located at the root of the project.

The built behaviors, along with a behavior metadata file (`behaviorMetadata.js`), can be found in the `dist` directory which will be created for you if it does not exist in the root of this project.


## API command

To run the behavior API server execute `./bin/cli api --build-behaviors`.

This will start the API server after all behaviors provided by this project have been built.

If you have already built the behaviors using the `behaviors` command provided by the cli then you may omit the `--build-behaviors` flag.


Some configuration of the API server can be done via the environment variables listed below

* `BEHAVIOR_API_HOST`: the host the api server will use (e.g. 127.0.0.1)
* `BEHAVIOR_API_PORT`: the port the api server will listen on (e.g. 3030)
* `WR_BEHAVIOR_DIR`: path to the directory containing the built behaviors
* `WR_BEHAVIOR_METADATA_PATH`: path to the behavior metadata file
* `BUILD_BEHAVIORS`: should the api server build the behaviors before starting



# Docker
To build the wr-behaviors docker image (`webrecorder/behaviors:latest`) execute `docker-compose build`.

The image created is suitable for building behaviors and running the behavior api server.

The default configuration of the image is to run the api server, however you can substitute the default command with any of the cli commands listed previously.

For more information please consult the provided `Dockerfile` and `docker-compose.yml` files.

## About Web Traffic


//consider making the status page space a seperate chapter or a seperate section because it kind of dominates chapter 1.
## Status page: pre-made behaviors

# Autoscroll


# Instagram

# Twitter

# Youtube Video



