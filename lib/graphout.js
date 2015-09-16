var EE     = require('events').EventEmitter,
    Log    = require('bristol'),
    Query  = require('./query'),
    Config = require('./config');

// constructor
var Graphout = module.exports = function(conf) {
    this.events  = new EE();
    this.options = Config(conf);
    this.logger  = Log;

    // configure logger
    this.logger.addTarget('console').withFormatter('syslog');
    this.logger.addTransform(function(elem) {
        // do not print file/line
        if (elem.file) return {};
        return null;
    });

    this.logger.info("graphite url is", this.options.graphite_url);

    // prepare outputs
    this.setupOutputs();
};

Graphout.prototype.setupOutputs = function() {
    for (var i in this.options.outputs) {
        try {
            var Output = require(this.options.outputs[i].output);
            new Output(this.events, this.logger, this.options.outputs[i].params);
        }
        catch(err) {
            this.logger.error("failed to load output module,", err.message, {output: i});
            continue;
        }

        // print
        this.logger.info("loaded output module", this.options.outputs[i].output, {output: i});
    }
};

Graphout.prototype.run = function() {
    for (var i in this.options.queries) {
        this.options.queries[i].name = i; // save the query key name
        new Query(this, this.options.queries[i]);
    }
};
