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


## Autopilot basics
Autopilot uses [behaviors](https://github.com/webrecorder/behaviors/blob/master/manual/behaviors.md) to collect metadata from websites. Behaviors are Javascript modules which perform a series of actions on a webpage in order to collect information. 

Autopilot has a cli, which has the following commands available. 

```
$ ./bin/cli --help

Usage: cli [options] [command]

Options:
  -V, --version  output the version number
  -h, --help     output usage information

Commands:
  api            Start the behavior api sever
  behaviors      Build and or validate behaviors, or generate their metadata
  help [cmd]     display help for [cmd]
```

//I can't yet explain how to use autopilot in the browser since the extension isn't finished yet, right? 

## About Web Traffic


## Status page: pre-made behaviors



