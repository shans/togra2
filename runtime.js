var T = require("./src/runtime.js");

var geometry = require("./browserPipes/geometry.js");
var material = require("./browserPipes/material.js");
var animation = require("./browserPipes/animation.js");
var mesh = require("./browserPipes/mesh.js");

function add(thing) {
  for (var name in thing)
    T[name] = thing[name];
}

[geometry, material, animation, mesh].map(add);

module.exports = T;
