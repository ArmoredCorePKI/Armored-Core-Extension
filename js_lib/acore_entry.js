var PBF = require('pbf');
var entry = require('./pentry.js').PUFEntry;

function parsePBEntry(entryBytes) {
    let pbf = new PBF(entryBytes);
    console.log("parsePBEntry", pbf);

    const entry_obj = entry.read(pbf);
    console.log(pbf);
    return entry_obj;
}

module.exports.parsePBEntry = parsePBEntry;