var pipe = require("../pipe.js");

exports.Shift = pipe.define(
	"Shift",
	{array: "[~a]", trigger: "Unit"},
	{array: "[~a]"},
	function(args) {
		let {array, trigger} = args;
		if (this.array == undefined) {
			this.array = array;
		} else {
			var first = this.array[0];
			this.array = this.array.slice(1);
			this.array.push(first);
		}
		return {array: this.array};
	});