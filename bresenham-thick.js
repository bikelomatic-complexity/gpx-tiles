
var bresenham = require('bresenham'),
  math = require('mathjs'),
  _ = require('underscore');

var Thickener = function(x1, y1, x2, y2, thickness, zoom, emit) {
  this.x1 = x1;
  this.y1 = y1;
  this.x2 = x2;
  this.y2 = y2;

  this.thickness = thickness;
  this.zoom = zoom;
  this.emit = emit;

  var angle = math.atan2(y2 - y1, x2 - x1);
  if(angle < math.pi / 2) {
    this.thickenUp = true;
  } else {
    this.thickenUp = false;
  }
};
Thickener.prototype.thicken = function(x, y) {
  for(i = math.ceil(-this.thickness / 2); i < (this.thickness / 2); i++) {
    var point = this.thickenUp ? {
      x: x,
      y: y + i
    } : {
      x: x + i,
      y: y
    };
    this.emit(point);
  }
};
Thickener.prototype.draw = function() {
  bresenham(this.x1, this.y1, this.x2, this.y2, _(this.thicken).bind(this));
};

var thick = module.exports = function(x1, y1, x2, y2, thickness, zoom, emit) {
  var t = new Thickener(x1, y1, x2, y2, thickness, zoom, emit);
  t.draw();
}
