# CLI

A cli is provided to help you use this project.

The commands available to you are displayed below 

```
$ ./bin/cli --help

Usage: cli <command> [options]

Options:
  -V, --version                        output the version number
  -h, --help                           output usage information

Commands:
  api [options]                        Start the behavior api sever
  behaviors [options]                  Build and or validate behaviors, or generate their metadata
  newBehavior [options]                Create a new behavior
  runner [options] <path-to-behavior>  Run and or build a behaviors
  stdlib [options]                     Commands specific to working with the behavior's std library
  help [cmd]                           display help for [cmd]
```

The cli provides four commands `api`, `behaviors`, `runner`, and `stdlib` and each command has its own options.


## API command
The api command allows you to start a server for serving your built behaviors.

To run the behavior api server execute `./bin/cli api --build-behaviors`. 

This will start the api server after all behaviors provided by wr-behaviors have been built. 

If you have already built the behaviors using the `behaviors` command provided by the cli then you may omit the `--build-behaviors` flag. 

Once the server is started the following endpoints are available

- `/behavior?<match how>`: endpoint for retrieving a behavior's code
- `/info?<match how>`: endpoint for retrieving a behavior's metadata
- `/info-list?<match how>`: endpoint for retrieving the metadata for all behavior's that match
- `/info-all`: endpoint for retrieving the metadata for every behavior

**match how**
 - `name=<name of the behavior>`
 - `url=<URL of page a behavior matches>`

The full options that available for use with this command are show below.
 
```
$ ./bin/cli api --help

Usage: cli-api [options]

Options:
  -V, --version                        output the version number
  -p, --port [port]                    The port the api server is to bind to (default: 3030)
  -h, --host [host]                    The host address the server is listen on (default: "127.0.0.1")
  -b, --behaviorDir [behaviorDir]      The path to the directory containing the build behaviors (default: "<cwd>/dist")
  -m, --behaviorMetadata [medataPath]  The path to the behavior metadata (default: "<cwd>/dist/behaviorMetadata.js")
  --build-behaviors                    Should the api server build the behaviors for starting up
  -w, --workers [numWorkers]           How many behavior lookup workers should be spawned (default: 2)
  -h, --help                           output usage information
```

Some configuration of the api server can be done via the environment variables listed below
- `BEHAVIOR_API_HOST`: the host the api server will use (e.g. 127.0.0.1)
- `BEHAVIOR_API_PORT`: the port the api server will listen on (e.g. 3030)
- `WR_BEHAVIOR_DIR`: path to the directory containing the built behaviors
- `WR_BEHAVIOR_METADATA_PATH`: path to the behavior metadata file
- `BUILD_BEHAVIORS`: should the api server build the behaviors before starting
- `NUM_WORKERS`: how many lookup workers should be spawned

## Build command
To build the behaviors made available by the project execute `./bin/cli behaviors -b`.

This will build the behaviors using the behavior config file located in the root of this project.

The built behaviors, along with a behavior metadata file (`behaviorMetadata.js`), can be found in the `dist` directory which will be created for you if it does not exist in the root of this project.

The full options that available for use with this command are show below.

```
$ ./bin/cli build --help

Usage: cli-build [options]

Options:
  -V, --version                    output the version number
  -v, --validate [fileOrDir]       
  -c, --config [configPath]        Path to the behavior config file (default: "<cwd>/dist/behavior-config.yml")
  -b, --build [fileOrDir]          Build a behaviors or all behaviors contained within a directory (default: true)
  -w, --watch [behaviorFileOrDir]  Watch the files, and their imports, in the build directory for re-bundling on changes (placed in dist directory)
  --metadata [dumpDir]             Generate behavior metadata, optionally supplying a path to directory where metadata is to be placed. Defaults to current working directory
  -h, --help                       output usage information
```

The config file has six keys and should specified in the config as `key: value`
- `behaviors`: path to the directory containing the un-built behaviors
- `lib`: path to the directory containing the provided behavior library or own library
- `build`: path to the directory where the intermediate files will be placed (for running using Webrecorders system)
- `dist`: path to directory where the fully built behaviors
- `tsconfig`: path to the typescript configuration file used to provide behavior inspection and validation
- `metadata`: path to where the behaviors metadata will be placed (either full path to file or directory path)
  
**Note**: Values can be relative path values as long as they are relative to the directory containing the config file. 

A default is provided for you and can be found in the root of the project `<path to project>/behavior-config.yml` and is the config file this command looks for (in the current working directory) if one is supplied using the `-c, --config` option.

When using the default config file this command can be used to build all behaviors using `./bin/cli behaviors -b`
otherwise, you will need specify your own config `./bin/cli behaviors -c <path to your config> -b`

For more details concerning the internals of the build process consult the documentation for the [build system](https://github.com/webrecorder/behaviors/wiki/Build-System).

## New behavior command
The newBehavior command provides a simple way to create a new behavior by generating a new file in the behavior directory containing the required boiler plate. 

Executing `./bin/cli newBehavior awesomeBehavior` will create a new behavior file `awesomeBehavior.js` located in the behavior directory.

The full options that are available are displayed below.

```
$ ./bin/cli newBehavior 
Usage: cli-newBehavior [options] <behavior file name>

Options:
  -V, --version               output the version number
  -d, --dir <directory name>  The new behavior will be created in the supplied directory name within the behaviors directory
  -h, --help                  output usage information
```

## Runner command

The runner command allows you to automatically run a behavior on a specified URL using a Chrome/Chromium browser installed on your machine.

The full options that are available are displayed below.

```
$ ./bin/cli help runner

Usage: cli-runner [options] [path-to-behavior]

Options:
  -V, --version                                output the version number
  --build-config [behavior build config path]  Path to the behavior config file (default: "<cwd>/behavior-config.yml")
  -c, --config [run config path]               Path to a behavior's run config file
  -r, --run                                    Builds and runs the behavior
  -w, --watch                                  Watches the behavior for changes rebuilding and running the behavior on change
  --run-built                                  Runs a previously built behavior
  -s, --slowmo <amount>                        How much slow mo (delay) should be used between behavior steps
  -t, --run-timeout <amount>                   Maximum amount of time a behavior will run
  -e, --chromeEXE <chrome executable>          The chrome executable to be launched rather than attempting to discover / choose the best version of chrome installed
  -u, --url <url>                              URL of the page to run the behavior on
  -h, --help                                   output usage information
```

Please note that in order to provide automatic running of behaviors, this command must be able to launch the Chrome/Chromium browser. In other words, an already running instance of Chrome/Chromium can not be used.

The simplest way to use this command is through the usage of a config file (yaml format) and can be supplied using the `-c` or `--config` flags like so `./bin/cli runner -c <path to run config.yaml>`.

An example run config is provided for you and can found in the root of this project (behavior-run-config.yml).  

The config file has seven keys and should specified in the config as `key: value`
- `buildConfig` (required): path to the behavior build config
- `behavior` (required): path to the behavior to be run
- `url` (required): the URL the behavior will be run on
- `mode` (optional): The available modes are
    - `build-watch`: build and run the behavior, rebuilds and restarts the behavior on changes to the behavior
    - `build`: build and run the behavior once (default mode)
    - `built`: just run the previously built behavior
- `chromeEXE` (optional): Chrome/Chromium executable path or command name to be used to launch (defaults to finding acceptable installed executable)
- `timeout` (optional): time value in seconds indicating the maximum length of time the behavior will run
- `slomo` (optional): time value in seconds indicating how long to wait before initiating the next action of the behavior

## STDLIB command

The stdlib command exists as an utility for generating the provided behavior utility library's `index.js` file or to create a bundle of all provided library function for debugging.

The file name of the generated debug script is `libOnWindow.js` and is placed in root dir of the project.

The full options that are available are displayed below.

```
$ ./bin/cli help stdlib

Usage: cli-stdlib [options]

Options:
  -V, --version   output the version number
  --gen-index     Generate the behavior's standard library's index file
  --debug-script  Generate a script that exposes the entirety of the behavior's standard library on window
  -h, --help      output usage information
```

