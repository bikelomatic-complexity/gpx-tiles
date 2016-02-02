var fs = require('fs');
var parseString = require('xml2js').parseString;
var Set = require('set');
var docuri = require('docuri');

var _ = require('underscore');
var ArgumentParser = require('argparse').ArgumentParser;

var thick = require('./bresenham-thick');
var names = require('./tile-names');

var parser = new ArgumentParser({
  version: '1.0.0',
  addHelp: true,
  description: 'Convert a GPX file to a tile list for use with the OSM stack'
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
parser.addArgument(
  ['-l', '--list-file'],
  {
    required: false,
    type: 'string',
    defaultValue: 'tiles.lst',
    help: 'Name of the TILES.LST file to generate',
    dest: 'outfile'
  }
);
parser.addArgument(
  ['-t', '--thickness'],
  {
    required: true, // This is an example improvement to the code
    type: 'int',
    defaultValue: 6,
    help: 'The desired thickness of the track in tiles',
  }
);
parser.addArgument(
  ['-z', '--zoom'],
  {
    required: false,
    type: 'int',
    nargs: 2,
    defaultValue: [0, 15],
    help: 'The min and max zoom levels to generate'
  }
);
var args = parser.parseArgs();

/*
 * Given a point as a [lat, lon] array and a zoom level, return tile coordinates
 * on the cartesian plane specific to that zoom level.
 */
function tile(pt, zoom) {
  var lat = pt[0];
  var lon = pt[1];
  return {
    x: names.long2tile(lon, zoom),
    y: names.lat2tile(lat, zoom)
  };
}

/*
 * Given the json representation of a gpx file, write out the tile list
 * conforming to the program arguments.
 */
function writeTileList(json) {

  // The way we invoke the bresenham line algorithm for each track segment
  // and on different zoom levels produces duplicate tile ids. For now, we
  // use a set to ensure uniqueness of tile ids.
  var set = new Set();

  // The set hashes elements by their string representation. The tileId route
  // function coverts objects to strings and strings to objects in the z/x/y
  // format.
  var tileId = docuri.route(':z/:x/:y');

  // The emit function to pass to the bresenham line algorithm implementation.
  // For each emitted point, we insert it into the set.
  var emit = function(pt) {
    set.add(tileId({
      x: '' + pt.x, // Ensure x, y, and z are passed to tileId as strings
      y: '' + pt.y,
      z: '' + this.zoom
    }));
  };

  json.gpx.trk[0].trkseg.forEach(function(trkseg) {

    // Coordinates is an array of arrays. The outer array represents the
    // track segment. The inner arrays are [lat, lon] coordinates
    var coordinates = trkseg.trkpt.map(function(trkpt) {
      return [
        parseFloat(trkpt['$'].lat),
        parseFloat(trkpt['$'].lon)
      ];
    });

    // Draw a thick bresenham line at each zoom level between trkpts starting
    // from the last trkpt to the first.
    var last = coordinates.pop();
    var coord0 = last;
    coordinates.reverse().forEach(function(coord1) {
      for(zoom = args.zoom[0]; zoom <= args.zoom[1]; zoom++) {
        var tile0 = tile(coord0, zoom);
        var tile1 = tile(coord1, zoom);
        thick(tile0.x, tile0.y, tile1.x, tile1.y, args.thickness, zoom, emit);
      }
      coord0 = coord1;
    });
  });

  // Iterate through the set and write out lines in 'z, x, y' format
  var stream = fs.createWriteStream(args.outfile);
  stream.once('open', function(fd) {
    set.get().map(function(id) {
      return tileId(id);
    }).forEach(function(t) {
      stream.write(t.z + ', ' + t.x + ', ' + t.y + '\n');
    });
    stream.end();
  });
}

// Read in the GPX file and start the conversion process
fs.readFile(args.infile, 'utf8', function(err, data) {
  if(err) {
    return console.error(err);
  }
  parseString(data, function(err, result) {
    if(err) {
      return console.error(err);
    }
    writeTileList(result);
  });
});
