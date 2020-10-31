## Installation

1. Install python3

2. Install pip and virtualenv

```
python3 -m pip install --user --upgrade pip

python3 -m pip install --user virtualenv
```

3. Create virtualenv
```
python3 -m venv env
source env/bin/activate
pip install pywb
```

## Development

Every time you open a new terminal and want to run the tests, you must activate
the python virtual environment:

```
source env/bin/activate
```

To test all behaviors, run

```
node all.js
```

You can test a single behavior by doing

```
./test-one-behavior.sh behaviorMetadataName
```

Where behaviorMetadataName is `test.metadata.name` found in `../tests/helpers/testedValues.js`


### Troublehsotoing

If 8080 port already in use:

```sh
$ ps -ef | grep wayback
okdistr+ 15492  3991  0 16:28 pts/9    00:00:00 /usr/bin/python3 /home/okdistribute/.local/bin/wayback --enable-auto-fetch --live --proxy-record --proxy slideShareBehavior -p 8080
okdistr+ 16105 17956  0 16:30 pts/9    00:00:00 grep --color=auto wayback

$ kill 15492
```

