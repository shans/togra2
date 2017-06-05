var connect = require("./connect.js");

class Togra {

	constructor() {
		this.pipes = new Set();
		this.connections = new Set();
	}

  build(s, objects, data) {
    return connect.build(this, s, objects, data);
  }

  schedule(f) {
    f();
  }

  go() {
    
  }

}

module.exports = Togra;