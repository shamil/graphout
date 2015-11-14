var EE     = require('events').EventEmitter,
    Config = require('./config'),
    Logger = require('./logger'),
    Output = require('./output'),
    Query  = require('./query');

// constructor
var Graphout = module.exports = function(conf) {
    this.options = Config(conf);
    this.events  = new EE();
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
};

Graphout.prototype.startOutputs = function() {
    for (var i in this.options.outputs) {
        this.options.outputs[i].name = i; // save the output key name
        new Output(this, this.options.outputs[i]);
    }
};

Graphout.prototype.startQueries = function() {
    for (var i in this.options.queries) {
        this.options.queries[i].name = i; // save the query key name
        new Query(this, this.options.queries[i]);
    }
};

Graphout.prototype.run = function() {
    this.startOutputs();
    this.startQueries();
}
