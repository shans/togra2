var pipe = require("../pipe.js");

var UnitToList = pipe.define("UnitToList", {input: "~a"}, {output: "[~a]"}, ({input}) => ({ output: [input] }));

module.exports = { UnitToList };