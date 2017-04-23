var T = require("../src/runtime.js");

var Mesh = T.define(
  "Mesh",
  {geometry: "Geometry", material: "Material"},
  {mesh: "Mesh"},
  function(args) {
    let {geometry, material} = args;
    if (!this.mesh) {
      this.mesh = new THREE.Mesh(geometry, material);
    } else {
      this.mesh.geometry = geometry;
      this.mesh.material = material;
    };
    return {mesh: this.mesh};
  });

var TranslateMesh = T.define(
  "TranslateMesh",
  {origin: "Point3", mesh: "Mesh"},
  {mesh: "Mesh"},
  ({origin, mesh}) => {
    mesh.position.x = origin.x;
    mesh.position.y = origin.y;
    mesh.position.z = origin.z;
    return {mesh}
  });

var RotateMesh = T.define(
  "RotateMesh",
  {x: "Number", y: "Number", z: "Number", mesh: "Mesh"},
  {mesh: "Mesh"},
  ({x, y, z, mesh}) => {
    mesh.rotation.x = x;
    mesh.rotation.y = y;
    mesh.rotation.z = z;
    return {mesh};
  });

module.exports = { Mesh, TranslateMesh, RotateMesh };