var EE     = require('events').EventEmitter,
    Log    = require('bristol'),
    Query  = require('./query'),
    Config = require('./config');

// constructor
var Graphout = module.exports = function(conf) {
    this.events  = new EE();
    this.options = Config(conf);
    this.logger  = Log;

    // convert to milisecconds
    this.options.interval *= 1000;

    // do not limit event listeners
    this.events.setMaxListeners(0);

    // configure logger
    this.logger.addTarget('console')
        .withFormatter('syslog')
        .withLowestSeverity(this.options.log_level);

    this.logger.addTransform(function(elem) {
        // do not print file/line
        if (elem.file) return {};
        return null;
    });

    // log config info
    this.logger.info({log_level: this.options.log_level});
    this.logger.info({graphite_url: this.options.graphite_url});
    this.logger.info({interval: this.options.interval});
    this.logger.info({splay: this.options.splay});

    // prepare outputs
    this.setupOutputs();
};

// goes over all configured outputs nad loads them
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

        this.logger.info("loaded output", {name: i, module: this.options.outputs[i].output});
    }
};

Graphout.prototype.run = function() {
    for (var i in this.options.queries) {
        this.options.queries[i].name = i; // save the query key name
        new Query(this, this.options.queries[i]);
    }
};
