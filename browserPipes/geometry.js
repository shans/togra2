var T = require("../src/runtime.js");

// TODO: some kind of reference counting system so that geometry objects can be released?
var Sphere = T.define(
  "Sphere",
  {radius: "Length", widthSegments: "Number", heightSegments: "Number"},
  {geometry: "Geometry"},
  ({radius, widthSegments, heightSegments}) => {
    var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    return {geometry};
  });

var Box = T.define(
  "Box",
  {width: "Length", height: "Length", depth: "Length"},
  {geometry: "Geometry"},
  ({width, height, depth}) => {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    return {geometry};
  });

module.exports = { Sphere, Box }