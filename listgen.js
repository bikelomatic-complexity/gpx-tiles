
var _ = require('underscore');

var thick = require('./bresenham-thick');
var names = require('./tile-names');

var thickness = 4;
var zoom = 12;

var pt0 = {lat: 43.9554, lon: -86.4524};
var pt1 = {lat: 42.7194, lon: -82.4922};

var tile = function(pt, zoom) {
  return {
    y: names.lat2tile(pt.lat, zoom),
    x: names.long2tile(pt.lon, zoom)
  };
};

var emit = function(pt) {
  console.log(this.zoom + ', ' + pt.x + ', ' + pt.y);
};

for(var i = 1; i <= zoom; i++) {
  var tile0 = tile(pt0, i);
  var tile1 = tile(pt1, i);

  thick(tile0.x, tile0.y, tile1.x, tile1.y, thickness, i, emit);
}
