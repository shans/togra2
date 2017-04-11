"use strict";

var geom = require("./geometry.js");
var Point2 = geom.Point2;

class Output {
	constructor() {
		this.watchers = [];
	}
	when(f) {
		this.watchers.push(f);
	}
	update() {
		this.watchers.forEach(f => f());
	}

	current() {}
}

class PipeOutput extends Output {
	constructor(pipe, name) {
		super();
		this._pipe = pipe;
		this._name = name;
	}

	set(value) {
		this.value = value;
		this.update();
	}

	current() {
		return this.value;
	}
}

class Immediate extends Output {
	constructor(value) {
		super();
		this._value = value;
	}

	current() {
		return this._value;
	}
}

class Pipe {
	constructor() {
		this.inputs = new Map();
		this.inputTypes = new Map();
		this.outputTypes = new Map();
		this.outputs = new Map();
	}

	connectInput(name, input) {
		if (this.inputTypes.has(name))
			this.inputs.set(name, input);
		else
			throw "NoSuchInput";
		this._maybeReady();
	}

	getOutput(name) {
		if (this.outputTypes.has(name)) {
			var output = new PipeOutput(this, name);
			this.outputs.set(name, output);
		} else {
			throw "NoSuchOutput " + name;
		}
		this._maybeReady();
		return this.outputs.get(name);
	}

	setOutput(name, value) {
		this.outputs.get(name).set(value);
	}

	_maybeReady() {
		if (this.inputs.size == this.inputTypes.size && this.outputs.size == this.outputTypes.size)
			this.ready();
	}

	// TODO: provide change information
	_apply(inputs, f) {
		var args = {};
		for (var input of inputs) {
			args[input] = this.inputs.get(input).current();
		}
		f.call(this, args);
	}

	watch(inputs, f) {
		var inputObjects = inputs.map(i => this.inputs.get(i));
		for (var input of inputObjects) {
			input.when(() => {
				this._apply(inputs, f);
			});
		}
		this._apply(inputs, f);
	}
}

function define(name, inputs, outputs, f) {
	return class extends Pipe {
		static get name() {
			return name;
		}
		static get definedInputs() {
			return inputs;
		}
		static get definedOutputs() {
			return outputs;
		}
		static get f() {
			return f;
		}
		constructor() {
			super();
			for (var input in inputs)
				this.inputTypes.set(input, inputs[input]);
			for (var output in outputs)
				this.outputTypes.set(output, outputs[output]);
		}

		ready() {
			this.watch(Object.keys(inputs), args => {
				let result = f(args);
				for (var output in outputs)
					this.setOutput(output, result[output]);
			});
		}
	}
}

function map(pipeClass, input) {
	return zipper(pipeClass, [input]);
}

function zipper(pipeClass, mapped) {
	var inputs = {};
	for (var i in pipeClass.definedInputs)
		inputs[i] = pipeClass.definedInputs[i];
	for (var i of mapped)
		inputs[i] = '[' + inputs[i] + ']';

	var outputs = {};

	if (Object.keys(pipeClass.definedOutputs).length > 1)
	 	throw "Can'tMapMultipleOutputs";
	var output = Object.keys(pipeClass.definedOutputs)[0];
	outputs[output] = '[' + pipeClass.definedOutputs[output] + ']';

	return class extends Pipe {
		static get name() {
			return "Mapped" + pipeClass + ":" + input;
		}
		static get definedInputs() {
			return inputs;
		}
		static get definedOutputs() {
			return outputs;
		}
		static get f() {
			return f;
		}		
		constructor() {
			super();
			for (var i in inputs)
				this.inputTypes.set(i, inputs[i]);
			this.outputTypes.set(output, outputs[output]);
			this.mappedPipes = [];
			this.mappedInputs = {};
			for (var i of mapped)
				this.mappedInputs[i] = [];
		}
		mappedChanged(name, mappedInput) {
			// TODO init/teardown
			this.mappedInputs[name] = mappedInput;
			var length = Math.min(...mapped.map(a => this.mappedInputs[a].length));
			if (this.mappedPipes.length > length) {
				this.mappedPipes = this.mappedPipes.slice(0, length);
			}
			while (this.mappedPipes.length < length) {
				this.mappedPipes.push(new pipeClass());
			}
		}
		respondToChange() {			
			var args = {};
			for (var i of Object.keys(inputs)) {
				if (mapped.indexOf(i) !== -1)
					continue;
				args[i] = this.inputs.get(i).current();
			}
			var result = [];
			for (var i = 0; i < this.mappedPipes.length; i++) {
				for (var j of mapped)
					args[j] = this.mappedInputs[j][i];
				var out = pipeClass.f.call(this.mappedPipes[i], args);
				result.push(out[output]);
			}
			this.setOutput(output, result);
		}
		ready() {
			var inputsExceptMapped = [];
			for (var i of Object.keys(inputs)) {
				if (mapped.indexOf(i) !== -1)
					continue;
				inputsExceptMapped.push(i);
			}
			mapped.forEach(mI => this.inputs.get(mI).when(() => {
				this.mappedChanged(mI, this.inputs.get(mI).current());
				this.respondToChange();
			}));

			var inputObjects = inputsExceptMapped.map(i => this.inputs.get(i));
			for (var i of inputObjects) {
				i.when(() => {
					this.respondToChange();
				});
			}

			mapped.forEach(mI => this.mappedChanged(mI, this.inputs.get(mI).current()));
			this.respondToChange();
		}
	}
}

module.exports = {define, map, zipper, Immediate, Output};