/*

if errors does it exit?

*/




const { tests } = require('../helpers/testedValues')
const child = require('child_process')
const series = require('run-series')

const tasks = []

tests.forEach((test) => {
  tasks.push((done) => {
    console.log('spawning', test.metadata.name)
    var proc = child.spawn('bash', ['./test/status/test-one-behavior.sh', test.metadata.name])
    proc.stderr.pipe(process.stderr)
    proc.stdout.pipe(process.stdout)
    proc.on('exit', () => done())
  })
})

series(tasks, (err) => {
  if (err) throw err
  console.log('All done!')
})
