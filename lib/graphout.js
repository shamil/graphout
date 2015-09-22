var EE     = require('events').EventEmitter,
    Config = require('./config'),
    Logger = require('./logger'),
    Query  = require('./query');

// constructor
var Graphout = module.exports = function(conf) {
    this.events  = new EE();
    this.options = Config(conf);
    this.log     = new Logger.Instance();

    // convert to milisecconds
    this.options.interval *= 1000;

    // do not limit event listeners
    this.events.setMaxListeners(0);

    // configure logger
    this.log.addTarget('file', {file: this.options.log_file})
        .withLowestSeverity(this.options.log_level)
        .withFormatter('syslog');

    // log config info
    this.log.info({log_level: this.options.log_level});
    this.log.info({graphite_url: this.options.graphite_url});
    this.log.info({interval: this.options.interval});
    this.log.info({splay: this.options.splay});

    // prepare outputs
    this.setupOutputs();
};

// goes over all configured outputs nad loads them
Graphout.prototype.setupOutputs = function() {
    for (var i in this.options.outputs) {
        var output_module = this.options.outputs[i].output,
            output_params = this.options.outputs[i].params,
            subLogger     = this.log.subLogger();

        subLogger.setGlobal('output', i);
        subLogger.setGlobal('module', output_module);

        try {

            var Output = require(output_module);
            new Output(this.events, subLogger, output_params);
        }
        catch(e) {
            subLogger.error("cannot load output,", {error: e.message});
            continue;
        }

        subLogger.info("loaded output");
    }
};

Graphout.prototype.run = function() {
    for (var i in this.options.queries) {
        this.options.queries[i].name = i; // save the query key name
        new Query(this, this.options.queries[i]);
    }
};
