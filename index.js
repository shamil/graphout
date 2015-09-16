#!/usr/bin/env node

// the the process name
process.title = "graphout";

var Graphout = require('./lib/graphout');
new Graphout("./graphout.example.json").run();
