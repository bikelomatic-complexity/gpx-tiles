var fs = require('fs');
var gpx = require('idris-gpx');
var _ = require('underscore');
var ArgumentParser = require('argparse').ArgumentParser;

var thick = require('./bresenham-thick');
var names = require('./tile-names');

var parser = new ArgumentParser({
  version: '0.0.1',
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
    required: false,
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

// var zoom = 12;
//
// var pt0 = {lat: 43.9554, lon: -86.4524};
// var pt1 = {lat: 42.7194, lon: -82.4922};
//
var tile = function(pt, zoom) {
  return {
    x: names.long2tile(pt.lon, zoom),
    y: names.lat2tile(pt.lat, zoom)
  };
};
//
// var emit = function(pt) {
//   console.log(this.zoom + ', ' + pt.x + ', ' + pt.y);
// };
//
// for(var i = 1; i <= zoom; i++) {
//   var tile0 = tile(pt0, i);
//   var tile1 = tile(pt1, i);
//
//   thick(tile0.x, tile0.y, tile1.x, tile1.y, thickness, i, emit);
// }

var stream = fs.createWriteStream(args.outfile);
stream.once('open', function(fd) {
  var emit = function(pt) {
    stream.write(this.zoom + ', ' + pt.x + ', ' + pt.y + '\n');
  };

  gpx.points(args.infile, function(collection) {
    var coordinates = collection.features.map(function(point) {
      return point.geometry.coordinates;
    });

    var last = coordinates.pop();
    var coord0 = {
      lat: last[1],
      lon: last[0]
    };
    coordinates.forEach(function(coordinate) {
      var coord1 = {
        lat: coordinate[1],
        lon: coordinate[0]
      };
      for(zoom = args.zoom[0]; zoom <= args.zoom[1]; zoom++) {
        var tile0 = tile(coord0, zoom);
        var tile1 = tile(coord1, zoom);
        debugger;

        thick(tile0.x, tile0.y, tile1.x, tile1.y, args.thickness, zoom, emit);
      }
      coord0 = coord1;
    });

    stream.end();
  });
});
