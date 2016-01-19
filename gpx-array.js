var fs = require('fs');
var parseString = require('xml2js').parseString;

var ArgumentParser = require('argparse').ArgumentParser;

var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'GPX to array file'
});
parser.addArgument(
  ['-g', '--gpx-file'],
  {
    required: true,
    type: 'string',
    help: 'Path to the gpx file',
    dest: 'infile'
  }
);

var args = parser.parseArgs();

fs.readFile(args.infile, 'utf8', function(err, data){
  if (err) {
    return console.error(err);
  }
  parseString(data, function (err, result) {
    if (err) {
      return console.error(err);
    }
    renderTrack(result);
  });
});


function renderTrack(object){
  console.log('[');
  object.gpx.trk[0].trkseg.forEach(function(trkseg){
    console.log('[');
    trkseg.trkpt.forEach(function(trkpt){
      var lat = trkpt['$'].lat;
      var lon = trkpt['$'].lon;
      console.log('['+lat+','+lon+'],');
    })
    console.log('],');
  });
  console.log(']');
}
