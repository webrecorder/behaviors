# Chapter 1


## What is web archiving?

Web archiving is the process of recording web resources. Various elements of the website such as HTML, scripts, images, videos, etc. can be recorded to preserve as much of the original resource as possible. By creating dynamic archives that provide a user with the same experience they would have if they accessed the original site, web archives can give much more information than a static screenshot. 

Web archives may be utilized by future researchers, historians and the general public. 

## Why Autopilot?

Autopilot is a tool that navigates a website similarly to how a human would, doing things like scrolling, clicking buttons, and playing videos. These actions executed through functions called "behaviors." Because Autopilot can go through the technically complicated aspects of a website, it is useful for recording high-fidelity websites.

## Installing Autopilot

To use this project you must first install its dependencies

`$ yarn install
# or "npm install"`

If you wish to use this project via Docker, install [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/).

To install Autopilot, use Terminal to clone the Webrecorder repository: 
1. `git clone `
2. `cd autopilot; bash init-default.sh.`
3. `docker-compose build`
4. `docker-compose up -d`

The Autopilot instance can be accessed in the browser at `http://localhost:8089`.


## Autopilot basics
	Autopilot uses [behaviors](https://github.com/webrecorder/behaviors/blob/master/manual/behaviors.md) to collect metadata from websites. Behaviors are Javascript modules which 

##About Web Traffic


## Status page: pre-made behaviors


# Chapter 2: Using Autopilot
## Creating your first behavior
## Testing your first behavior
## Fixing a broken behavior
## Checking behavior status