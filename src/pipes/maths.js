var pipe = require("../pipe.js");

exports.Multiply = pipe.define("Multiply", {a: "Number", b: "Number"}, {out: "Number"}, ({a, b}) => ({out: a*b}));
exports.Add = pipe.define("Multiply", {a: "Number", b: "Number"}, {out: "Number"}, ({a, b}) => ({out: a + b}));