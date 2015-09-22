#!/usr/bin/env node

// the the process name
process.title = "graphout";

var Fs        = require('fs'),
    ParseArgs = require('minimist'),
    Graphout  = require('./lib/graphout'),

argv = ParseArgs(process.argv.slice(2), {
    boolean: ['help', 'version'],
    alias: {config: 'c', pid: 'p', help: 'h'}
});

// print help & exit
if (argv.help) {
    console.log("usage:", process.title, "--config <config-path> --pid <pid-path>");
    process.exit(0);
}

// print help & exit
if (argv.version) {
    console.log("%s - v%s", process.title, require('./package').version);
    process.exit(0);
}

// normalize args
var config   = argv.config || '/etc/graphout/graphout.json',
    pid_file = argv.pid    || '/var/run/graphout.pid';

// check pid
try {
    var pid = parseInt(Fs.readFileSync(pid_file).toString());
    process.kill(pid, 0); // check if already running
    console.error(process.title, 'already running, PID', pid);
    process.exit(1);
}
catch(e) {}

// write pid
try {
    Fs.writeFileSync(pid_file, process.pid);
}
catch(e) {
    console.error('cannot write PID file:', e.message);
    process.exit(1);
}

// run graphout
new Graphout(config).run();
