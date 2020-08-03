kill $(ps aux | grep 'wayback --enable-auto-fetch' | awk '{print $2}')
wb-manager init $1
wayback --enable-auto-fetch --live --proxy-record --proxy $1 -p 8080 & endlessloop_pid=$!
echo $endlessloop_pid
echo $1
../../node_modules/.bin/ava --verbose lib/one.js --match $1
# node lib/output-status.js $1
kill "$endlessloop_pid"
