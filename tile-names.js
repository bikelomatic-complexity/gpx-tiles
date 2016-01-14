


exports.long2tile = function(lon, zoom) {
  return (Math.floor((lon+180)/360*Math.pow(2,zoom)));
}

exports.lat2tile = function(lat, zoom) {
  return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
}
