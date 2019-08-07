# Build System 

## Overview

The behavior build process has three phases
- Initialization 
- Collection
- Building


## Initialization

Initialization has three steps
1. Ultimate build configuration
2. Building what resolution
3. Ensuring the necessary build directory structure exists


#### Ultimate build configuration

The ultimate build configuration is created in combination with user supplied cli options using the following steps

 1. If a config was specified using `-c, --config` it is used 
 2. If the default config exists in the current working directory of the commands it used 
 3. Otherwise the path to the behavior file or dir (`-b, --build [fileOrDir]`) is used and the six config values are set to the project defaults 

When a config file is used each of the six values from the config file are resolved as follows 
- if the key exists and value is relative, make absolute by resolving it against the directory containing the config file
- if the key exists and is absolute, use key value
- if key does not exist use project default value
  - build, dist: `<directory containing config>/<name>`
  - lib, tsconfig: projects default value
  - metadata: placed in current working directory 
  
 
Once the ultimate build configuration has been created, the build process proceeds to the next step.

#### Building what resolution

The determination for what is being built is done using the value for the `-b, --build` cli option and that value can be one of two types
- `boolean`: build all behaviors found in the value for the `behaviors` key from the supplied build config 
- `string`: path to a directory containing behaviors or a single behavior to be built

When the value for build is `boolean`
- If the directory supplied via the `behaviors` config key exists, the what is being built is that directory and the initialization process contains to the next step
- Otherwise the directory supplied via the `behaviors` config key does not exist the build process is ended

When the value for build is a `string` and an absolute path 
- If the path exists, the what is being built is that directory or file and the initialization process contains to the next step
- Otherwise the path does not exist the build process is ended

When the value for build is a `string` and an relative path, it is resolved in the following order
1. the value as is resolved using node's relative path resolution algorithm. Note this value is used by other steps if previous ones fail and is denoted as `resolvedPath`
2. the value as is joined with the supplied configs behavior dir or projects default behavior dir
3. the value as is joined with the the current working directory
4. `resolvedPath` joined with the supplied configs behavior dir or projects default behavior dir
5. `resolvedPath` joined with the current working directory

If any of the absolute paths described above exist, the what is being built is the resolved path and the initialization process contains to the next step otherwise the build process is ended

#### Ensuring the necessary build directory structure exists

The final step in the initialization process is to ensure that the `build` and `dist` directories exist.

These values may differ from the names used previously only when they are supplied by the user in a build config file.

The `build` directory is used to hold intermediate files used by the build system in order to setup the behavior for final building and usage by other tools such as our own running system.

Any setup in order to facilitate running the behavior is done here.

The `dist` directory is where the built, bundled, behaviors are placed alongside their metadata if configured to do so.


## Collection

The collection phase operates in one of two modes
- `single behavior`: when the `what is being built` path resolves to file 
- `multi-behavior`: when the `what is being built` path resolves to a directory

The primary difference between modes is that `multi-behavior` mode considers every file contained in the directory and its descendant directories.

Both modes use the same means in determining if a file is indeed a behavior which is as follows
- the file is an es module
- has a `metadata` or `metaData` named export 
- has a `isBehavior` named export    

Once the behavior(s) have been collected a report is printed stating how many behaviors were found and if any of the files considered partially met the requirements for collection. 

**Note**: Both the collection and building phases share modes with the mode operating under set by the collection phase. 

## Building

The building phase can be described in the following steps:
1. Extract behaviors metadata
2. Create the behavior's intermediate file in the configured `build` directory
3. Use build behavior using rollup, built behavior placed in configured `dist` directory
4. Once all behaviors have been built generate behavior metadata.


The previous steps are applied to all behaviors returned by the collection phase
