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

// This is a bit broken for a couple of reasons.
// The scene changing doesn't really make sense if not
// coordinated with mesh inputs, so maybe it should be
// an input parameter instead. But there's no way to do
// that with T.define yet.
//
// Also it's strange to think of this like a pipeline
// with updates given that we kinda actually want to
// know only when the meshes themselves are created
// or deleted. 
var RenderMeshes = T.define(
  "RenderMesh",
  {meshes: "[Mesh]", scene: "Scene"},
  {},
  // TODO: how to deal with deletion?
  function(args) {
    let { meshes, scene } = args;
    if (this.meshes == undefined)
      this.meshes = new Set();
    meshes.forEach(m => {
      if (!this.meshes.has(m)) {
        this.meshes.add(m);
        scene.add(m);
      }
    });
  });

module.exports = { Mesh, TranslateMesh, RotateMesh, RenderMeshes };