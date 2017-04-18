var geometry = require("./geometry.js");
var pipe = require("./pipe.js");
var connect = require("./connect.js");
var generators = require("./pipes/generators.js");
var maths = require("./pipes/maths.js");
var array = require("./pipes/array.js");
var util = require("./pipes/util.js");

var exports = {};

function add(thing) {
	for (var name in thing)
		exports[name] = thing[name];
}

[geometry, pipe, connect, generators, maths, array, util].map(add);

module.exports = exports;
