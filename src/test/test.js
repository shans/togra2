var T = require('../runtime.js');


var p = new T.CirclePipe();
p.connectInput("origin", new T.Immediate(new T.Point2(0, 0)));
p.connectInput("radius", new T.Immediate(10));
p.connectInput("numPoints", new T.Immediate(20));
var points = p.getOutput("points");