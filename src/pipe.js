"use strict";

var geom = require("./geometry.js");
var connect = require("./connect.js");
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
		constructor() {
			super();
			for (var input in inputs)
				this.inputTypes.set(input, inputs[input]);
			for (var output in outputs)
				this.outputTypes.set(output, outputs[output]);
		}

		ready() {
			this.watch(Object.keys(inputs), args => {
				let result = f.bind(this)(args);
				for (var output in outputs)
					this.setOutput(output, result[output]);
			});
		}
	}
}

function group(definition, data) {
	var inputs = {};
	var outputs = {};
	if (data == undefined) {data = {}};

	// TODO have a lighter-weight parser to extract just the types.
	var objects = connect.build(definition, {}, data);

	for (var name in objects) {
		var pipe = objects[name];
		for (var input of pipe.inputTypes.keys()) {
			if (pipe.inputs.get(input) == undefined) {
					inputs[input] = pipe.inputTypes.get(input);
			}
		}
		for (var output of pipe.outputTypes.keys()) {
			if (pipe.outputs.get(output) == undefined) {
					outputs[output] = pipe.outputTypes.get(output);
			}
		}
	}

	return class extends Pipe {
		static get name() {
			return `Group(${definition})`;
		}
		static get definedInputs() {
			return inputs;
		}
		static get definedOutputs() {
			return outputs;
		}
		constructor() {
			super();

			this.inputPipes = new Map();
			this.outputPipes = new Map();
			if (data == undefined) {data = {}};
			var objects = connect.build(definition, {}, data);
			for (var name in objects) {
				var pipe = objects[name];
				for (var input of pipe.inputTypes.keys()) {
					if (pipe.inputs.get(input) == undefined) {
						this.inputTypes.set(input, pipe.inputTypes.get(input));
						this.inputPipes.set(input, pipe);
					}
				}
				for (var output of pipe.outputTypes.keys()) {
					if (pipe.outputs.get(output) == undefined) {
						this.outputTypes.set(output, pipe.outputTypes.get(output));
						this.outputPipes.set(output, pipe);
					}
				}
			}

		}
		connectInput(name, input) {
			this.inputPipes.get(name).connectInput(name, input);
			this.inputs.set(name, this.inputPipes.get(name).inputs.get(name));
		}

		getOutput(name) {
			var output = this.outputPipes.get(name).getOutput(name);
			this.outputs.set(name, output);
			return output;
		}		
	}

}

function map(pipeClass, input) {
	return zipper(pipeClass, [input]);
}

class MultiplexingOutput {
	constructor(pipe, output, size) {
		this.pipe = pipe;
		this.output = output;
		this.value = [];
		this.size = size;
		this.count = 0;
	}
	setSize(size) {
		this.size = size;
		this.value = this.value.slice(0, size);
		this.count = 0;
	}
	setOutput(index, output) {
		var apply = () => {
			this.value[index] = output.current();
			this.count++;
			if (this.count == this.size) {
				this.pipe.setOutput(this.output, this.value);
				this.count = 0;
			}
		}
		output.when(apply);
		apply();
	}
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
			return "Mapped" + pipeClass.name + ":" + mapped;
		}
		static get definedInputs() {
			return inputs;
		}
		static get definedOutputs() {
			return outputs;
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
			this.multiplexingOutput.setSize(length);
			if (this.mappedPipes.length > length) {
				this.mappedPipes = this.mappedPipes.slice(0, length);
				// NEED TO DEAL WITH INPUT DEREGISTRATION HERE
				assert(false);
			}
			for (var i = 0; i < this.mappedPipes.length; i++) {
				var pipe = this.mappedPipes[i];
				pipe.inputs.get(name).set(mappedInput[i])
			}

			while (this.mappedPipes.length < length) {
				var pipe = new pipeClass();
				for (var i of this.inputsExceptMapped) {
					pipe.connectInput(i, this.inputs.get(i));
				}
				for (var mI of mapped) {
					// TODO:pass in mapped input pipe/name?
					var pipeOutput = new PipeOutput();
					pipeOutput.set(this.inputs.get(mI).current()[this.mappedPipes.length]);
					pipe.connectInput(mI, pipeOutput);
				}
				this.multiplexingOutput.setOutput(this.mappedPipes.length, pipe.getOutput(output));
				this.mappedPipes.push(pipe);
			}
		}

		ready() {
			var inputsExceptMapped = [];
			for (var i of Object.keys(inputs)) {
				if (mapped.indexOf(i) !== -1)
					continue;
				inputsExceptMapped.push(i);
			}
			this.inputsExceptMapped = inputsExceptMapped;
			this.multiplexingOutput = new MultiplexingOutput(this, output, 0);
			
			mapped.forEach(mI => {
				this.inputs.get(mI).when(() => {
					this.mappedChanged(mI, this.inputs.get(mI).current());
				});
				this.mappedChanged(mI, this.inputs.get(mI).current());
			});

		}
	}
}

var _memos = new Map();

function memoize(pipeClass) {
	return define(
		`Memo(${pipeClass.name})`,
		pipeClass.definedInputs,
		pipeClass.definedOutputs,
		function(args) {
			var strargs = JSON.stringify(args);
			if (this.memo && this.memo.has(strargs)) {
				return this.memo.get(strargs);
			}
			if (this.memo == undefined) {
				if (!_memos.has(pipeClass)) {
					this.memo = new Map();
					_memos.set(pipeClass, this.memo);
				} else {
					this.memo = _memos.get(pipeClass);
				}
				this.innerPipe = new pipeClass();
				for (var input in pipeClass.definedInputs) {
					var po = new PipeOutput();
					po.set(args[input]);
					this.innerPipe.connectInput(input, po);
				}
				for (var output in pipeClass.definedOutputs)
					this.innerPipe.getOutput(output);
			} else {
				for (var input in pipeClass.definedInputs)
					this.innerPipe.inputs.get(input).set(args[input])
			}
			var result = {};
			for (var output in pipeClass.definedOutputs) 
				result[output] = this.innerPipe.getOutput(output).current();
			this.memo.set(strargs, result);
			return result;
		});
}

Object.assign(module.exports, {define, map, zipper, group, memoize, Immediate, Output});