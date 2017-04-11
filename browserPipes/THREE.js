class UnitAnimationOutput extends T.Output {
	constructor(period) {
		super();
		this._period = period;
		this._baseTime = performance.now();
		this._currentTime = this._baseTime;
	}

	tick() {
		this._currentTime = performance.now();
		this.update();
	}

	current() {
		var t = ((this._currentTime - this._baseTime) % (this._period * 1000)) / this._period / 1000;
		return t;
	}
}

class TickOutput extends T.Output {
	constructor(period) {
		super();
		this._period = period;
		this._baseTime = performance.now();
		this._currentTime = this._baseTime;
		this._lastValue = 0;
	}

	tick() {
		this._currentTime = performance.now();
		var value = Math.floor((this._currentTime - this._baseTime) / (this._period * 1000));
		if (value !== this._lastValue) {
			this._lastValue = value;
			this.update();
		}
	}

	current() {
		return undefined;
	}
}

var Sphere = T.define(
	"Sphere",
	{origin: "Point3", radius: "Length", widthSegments: "Number", heightSegments: "Number"},
	{sphere: "Mesh"},
	function(args) {
		let {origin, radius, widthSegments, heightSegments} = args;
		if (!this.sphere) {
			var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
			var material = new THREE.MeshNormalMaterial();
			this.sphere = new THREE.Mesh(geometry, material);
			this.radius = radius;
		}
		if (this.radius != radius) {
			var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
			this.sphere.geometry.dispose();
			this.sphere.geometry = geometry;
			this.radius = radius;
		}
		this.sphere.position.x = origin.x;
		this.sphere.position.y = origin.y;
		this.sphere.position.z = origin.z;
		return {sphere: this.sphere};
	});