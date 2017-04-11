"use strict";

class Point2 {
	constructor(x, y) {
		this._x = x;
		this._y = y;
	}

	get x() {
		return this._x;
	}

	get y() {
		return this._y;
	}

	get z() {
		return 0;
	}

	translate(p) {
		return new Point2(this._x + p._x, this._y + p._y);
	}
}

module.exports = { Point2 }