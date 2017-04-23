var T = require("../src/runtime.js");

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

module.exports = { UnitAnimationOutput, TickOutput };