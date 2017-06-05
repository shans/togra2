var T = require("../src/runtime.js");

var tickers = [];

function tick() {
  var t = performance.now();
  tickers.forEach(a => a._tick(t));
}

class Animation extends T.Output {
  constructor(scheduler) {
    super(scheduler);
    this._baseTime = performance.now();
    this._currentTime = this._baseTime;
    tickers.push(this);
  }
  _tick(t) {
    this._currentTime = t;
    this.tick();
  }
}

class UnitAnimationOutput extends Animation {
  constructor(scheduler, period) {
    super(scheduler);
    this._period = period;
  }

  tick() {
    this.update();
  }

  current() {
    var t = ((this._currentTime - this._baseTime) % (this._period * 1000)) / this._period / 1000;
    return t;
  }
}

class TickOutput extends Animation {
  constructor(scheduler, period) {
    super(scheduler);
    this._period = period;
    this._lastValue = 0;
  }

  tick() {
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

module.exports = { UnitAnimationOutput, TickOutput, tick };