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
        .withFormatter('commonInfoModel');

    // log config info
    this.log.info({interval: this.options.interval});
    this.log.info({log_level: this.options.log_level});
    this.log.info({query_engine: this.options.query_engine});
    this.log.info({splay: this.options.splay});

    // load query engine
    this.query_engine = this.loadQueryEngine();
};

Graphout.prototype.loadQueryEngine = function() {
    try {
        this.log.info("loading query engine", {engine: this.options.query_engine});
        return require('./' + this.options.query_engine);
    }
    catch(e) {
        this.log.error("cannot load query engine,", {engine: this.options.query_engine, error: e.message});
    }
}

Graphout.prototype.startOutputs = function() {
    for (var i in this.options.outputs) {
        this.options.outputs[i].name = i; // save the output key name
        new Output(this, this.options.outputs[i]);
    }
};

Graphout.prototype.startQueries = function() {
    for (var i in this.options.queries) {
        this.options.queries[i].name = this.options.queries[i].name || i; // set default query name, if name was omitted
        new Query(this, this.options.queries[i]);
    }
};

Graphout.prototype.run = function() {
    if (!this.query_engine) {
        return;
    }

    this.startOutputs();
    this.startQueries();
}
