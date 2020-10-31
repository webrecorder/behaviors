wr-behaviors
=======================

### Installation
To use this project you must first install its dependencies

```bash
$ yarn install
# or "npm install"
```

### Build behaviors

```
npm run generate-runnable-behaviors
npm run build-dev
```

If you wish to use this project via Docker, see the **Docker** portion of the **Usage** section.

### Usage
wr-behaviors provides a cli to help you use this project.

The commands available to you are displayed below 

```bash
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

The cli provides two commands `api` and `behaviors` and each command has its own options.

#### Behaviors command
To build the behaviors made available by wr-behaviors execute `./bin/cli behaviors -b`.

This will build the behaviors using the behavior config file located in the root of this project. 

The built behaviors, along with a behavior metadata file (`behaviorMetadata.js`), can be found in the `dist` directory which will be created for you if it does not exist in the root of this project.

The full options that available for use with this command are show below.

```bash
$ ./bin/cli behaviors --help

Usage: cli-behaviors [options]

Options:
  -V, --version                    output the version number
  -v, --validate [fileOrDir]       
  -c, --config [configPath]        Path to the behavior config file (default: "<path to wr-behaviors>/behavior-config.yml")
  -b, --build [fileOrDir]          Build a behaviors or all behaviors contained within a directory (default: true)
  -w, --watch [behaviorFileOrDir]  Watch the files, and their imports, in the build directory for re-bundling on changes (placed in dist directory)
  --metadata [dumpDir]             Generate behavior metadata, optionally supplying a path to directory where metadata is to be placed. Defaults to current working directory
  -h, --help                       output usage information
```

#### API command
To run the behavior api server execute `./bin/cli api --build-behaviors`. 

This will start the api server after all behaviors provided by wr-behaviors have been built. 

If you have already built the behaviors using the `behaviors` command provided by the cli then you may omit the `--build-behaviors` flag. 

The full options that available for use with this command are show below.
 
```bash
$ ./bin/cli api --help

Usage: cli-api [options]

Options:
  -V, --version                        output the version number
  -p, --port [port]                    The port the api server is to bind to (default: 3030)
  -h, --host [host]                    The host address the server is listen on (default: "127.0.0.1")
  -b, --behaviorDir [behaviorDir]      The path to the directory containing the build behaviors (default: "<path to wr-behaviors>/dist")
  -m, --behaviorMetadata [medataPath]  The path to the behavior metadata (default: "<path to wr-behaviors>/dist/behaviorMetadata.js")
  --build-behaviors                    Should the api server build the behaviors for starting up
  -h, --help                           output usage information
```

Some configuration of the api server can be done via the environment variables listed below
- `BEHAVIOR_API_HOST`: the host the api server will use (e.g. 127.0.0.1)
- `BEHAVIOR_API_PORT`: the port the api server will listen on (e.g. 3030)
- `WR_BEHAVIOR_DIR`: path to the directory containing the built behaviors
- `WR_BEHAVIOR_METADATA_PATH`: path to the behavior metadata file
- `BUILD_BEHAVIORS`: should the api server build the behaviors before starting

### Docker
To build the wr-behaviors docker image (`webrecorder/behaviors:latest`) execute `docker-compose build`.

The image created is suitable for building behaviors and running the behavior api server.

The default configuration of the image is to run the api server, however you can substitute the default command
with any of the cli commands listed previously.

For more information please consult the provided `Dockerfile` and `docker-compose.yml` files.

#### Testing

```
yarn build-dev
yarn generate-test-helper-values
yarn generate-runnable-behaviors
```
