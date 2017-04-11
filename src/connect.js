var pipe = require("./pipe.js");
var parse = require("./parseGraph.js");
var geom = require("./geometry.js");
var assert = require("assert");

function matches(a, b) {
	if (a == "Point2" && b == "Point3")
		return true;
	if (a == "[Point2]" && b == "[Point3]")
		return true;
	return a == b;
}

exports.connect = function(inp, out) {
	for (var [fromName, fromType] of inp.outputTypes.entries()) {
		if (inp.outputs.has(fromName))
			continue;
		for (var [toName, toType] of out.inputTypes.entries()) {
			if (out.inputs.has(toName))
				continue;
			if (matches(fromType, toType)) {
				exports.connectNamed(inp, fromName, out, toName);
				return true;
			}
				
		}
	}

	return false;
}

exports.configureNamed = function(inp, name, value) {
	exports.inputNamed(inp, name, new pipe.Immediate(value));
}

exports.inputNamed = function(inp, name, value) {
	inp.connectInput(name, value);	
}

exports.connectNamed = function(inp, fromName, out, toName) {
	out.connectInput(toName, inp.getOutput(fromName));
}

function toValue(value, data) {
	if (typeof value == "number")
		return value;
	if (typeof value == "string")
		return data[value];
	if (typeof value == "object") {
		return new geom.Point2(value.x, value.y);
	}
}

exports.build = function(lines, objects, data) {
	var s = lines.join('\n');
	var graphLines = parse.parse(s);
	for (var line of graphLines) {
		for (var nodeDesc of line.nodes) {
			if (!objects[nodeDesc.name]) {
				if (T[nodeDesc.type])
					objects[nodeDesc.name] = new T[nodeDesc.type](...nodeDesc.inputs);
				else
					objects[nodeDesc.name] = eval("new " + nodeDesc.type + "(...nodeDesc.inputs)");
			}
			var o = objects[nodeDesc.name];
			for (var key in nodeDesc.configs) {
				var value = toValue(nodeDesc.configs[key], data);
				exports.configureNamed(o, key, value);
			}
		}
	}
	for (var line of graphLines) {
		for (var connection of line.connections) {
			var from = objects[connection.from];
			var to = objects[connection.to];
			if (from instanceof pipe.Output) {
				if (connection.toName) {
					exports.inputNamed(to, connection.toName, from);
				} else {
					assert(false);
				}
			} else {
				if (connection.fromName && connection.toName)
					exports.connectNamed(from, connection.fromName, to, connection.toName);
				else 
					exports.connect(from, to);
			}
		}
	}
	return objects;
}