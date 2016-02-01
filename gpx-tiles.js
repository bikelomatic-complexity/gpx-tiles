var fs = require('fs');
var gpx = require('idris-gpx');
var parseString = require('xml2js').parseString;

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
function tile(pt, zoom) {
  return {
    x: names.long2tile(pt.lon, zoom),
    y: names.lat2tile(pt.lat, zoom)
  };
}

function writeTileList(json) {
  var stream = fs.createWriteStream(args.outfile);
  stream.once('open', function(fd) {
    var emit = function(pt) {
      stream.write(this.zoom + ', ' + pt.x + ', ' + pt.y + '\n');
    };

    json.gpx.trk[0].trkseg.forEach(trkseg => {
      var coordinates = trkseg.trkpt.map(trkpt => {
        return [
          parseFloat(trkpt['$'].lat),
          parseFloat(trkpt['$'].lon)
        ];
      });
      // var coordinates = collection.features.map(function(point) {
      //   return point.geometry.coordinates;
      // });

      var last = coordinates.pop();
      var coord0 = {
        lat: last[0],
        lon: last[1]
      };
      coordinates.reverse().forEach(function(coordinate) {
        var coord1 = {
          lat: coordinate[0],
          lon: coordinate[1]
        };
        for(zoom = args.zoom[0]; zoom <= args.zoom[1]; zoom++) {
          //console.log('coord0 lat: ' + coord0.lat + ', coord1 lat: ' + coord1.lat);

          var tile0 = tile(coord0, zoom);
          var tile1 = tile(coord1, zoom);

					//console.log('Start x: ' + tile0.x + ', y: ' + tile0.y);
					//console.log('End   x: ' + tile1.x + ', y: ' + tile1.y);
          thick(tile0.x, tile0.y, tile1.x, tile1.y, args.thickness, zoom, emit);
        }
        coord0 = coord1;
      });
    });

    stream.end();
  });
}

fs.readFile(args.infile, 'utf8', (err, data) => {
  if(err) {
    return console.error(err);
  }
  parseString(data, (err, result) => {
    if(err) {
      return console.error(err);
    }
    writeTileList(result);
  });
});
