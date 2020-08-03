const CDXJReader = require('cdxj')
const path = require('path')
const through = require('through2')
const pump = require('pump')

const COLLECTION = process.argv[2]

const CDXJ_PATH = path.join(__dirname, 'collections', COLLECTION, 'indexes', 'index.cdxj')

const cdxjStream = CDXJReader.createReadStream(CDXJ_PATH)

var parseEntries = through.obj((cdxjEntry, enc, next) => {
  console.log(`The URL in surt form for this entry is: ${cdxjEntry.surt}`)
  console.log(`The raw datetime for this entry is: ${cdxjEntry.dt}`)
  console.log(`The json data for this entry is: ${JSON.stringify(cdxjEntry.json)}`)
  next(null, cdxjEntry)
})

pump(cdxjStream, parseEntries, (err) => {
  if (err) throw err
})


