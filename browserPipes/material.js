var T = require("../src/runtime.js");

var MeshNormalMaterial = T.define(
  "MeshNormalMaterial",
  {},
  {material: "Material"},
  () => ({material: new THREE.MeshNormalMaterial}));

module.exports = { MeshNormalMaterial };