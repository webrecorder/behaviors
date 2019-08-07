# Behaviors

## Quick Start

Requirements: [Node.js](https://nodejs.org/en/)

To use this project you must first install its dependencies

```bash
$ yarn install
# or "npm install"
```

Once you have installed the dependencies you are ready to start using the project

- [Overview on behaviors](./manual/behaviors.html)
- [Provided cli commands](./manual/cli.html)
- [Behavior standard library reference](./identifiers.html)

**Via Docker**

To build the behaviors docker image (`webrecorder/behaviors:latest`) execute `docker-compose build`.

The image created is suitable for building behaviors and running the behavior [api server](https://webrecorder.github.io/behaviors/manual/cli.html#api-command).

The default configuration of the image is to run the api server, however you can substitute the default command
with any of the cli commands listed previously.

For more information please consult the provided `Dockerfile` and `docker-compose.yml` files.


