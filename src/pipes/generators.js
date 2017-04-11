var pipe = require("../pipe.js");
var geom = require("../geometry.js");

exports.Circle = pipe.define(
	"Circle",
	{origin: "Point2", radius: "Number", numPoints: "Number"},
	{points: "[Point2]"},
	({radius, origin, numPoints}) => {
		var points = [];
		for (var i = 0; i < numPoints; i++) {
			points.push(origin.translate(
				new geom.Point2(radius * Math.cos(i * 2 * Math.PI / numPoints),
						   radius * Math.sin(i * 2 * Math.PI / numPoints))));
		}
		return {points};
	});