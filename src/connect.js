var pipe = require("./pipe.js");
var parse = require("./parseGraph.js");
var geom = require("./geometry.js");
var assert = require("assert");
var Togra = require("./togra.js");

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
	exports.inputNamed(inp, name, new pipe.Immediate(inp.scheduler, value));
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

function typeToClass(type, inputs) {
	if (type.op) {
		if (type.op == "group") {
			return T.group(type.data);
		}
		var clazz = typeToClass(type.prim.type, type.prim.inputs);
		return T[type.op](clazz, ...inputs);
	}
	if (T[type])
		return T[type];
	return eval(type);
}

function configure(instance, config, data) {
	for (var key in config) {
		var value = toValue(config[key], data);
		exports.configureNamed(instance, key, value);
	}	
}

function configuredInstance(togra, type, inputs, config, data) {
	var clazz = typeToClass(type, inputs);
	var instance = new clazz(togra, ...inputs);
	configure(instance, config, data);
	return instance;
}

exports.build = function(togra, s, objects, data) {
	var graphLines = parse.parse(s);
	for (var line of graphLines) {
		for (var nodeDesc of line.nodes) {
			if (!objects[nodeDesc.name]) {
				objects[nodeDesc.name] = configuredInstance(togra, nodeDesc.type, nodeDesc.inputs, nodeDesc.configs, data);
			} else {
				configure(objects[nodeDesc.name], nodeDesc.configs, data);
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