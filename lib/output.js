var EE = require('events').EventEmitter;

// constructor
var Output = module.exports = function(app, options) {

    // collect required information
    this.options = options;
    this.events  = app.events;
    this.log     = app.log.subLogger();

    // all logs messages will contain output & module names
    this.log.setGlobal('output', this.options.name);
    this.log.setGlobal('module', this.options.output);

    this.output_events = new EE();
    try {
        new require(this.options.output)(this.output_events, this.log, options.params)
        this.log.info("loaded output");
    }
    catch(e) {
        this.log.error("cannot load output,", {error: e.message});
    }

    //
    this.events.on('raw',    this.onRaw.bind(this));
    this.events.on('values', this.onValues.bind(this));
}

Output.prototype.onRaw = function(data, query_options) {
    // emit raw data (in case some output needs it)
    this.output_events.emit('raw', data, query_options);
}

Output.prototype.onValues = function(values, query_options) {
    // emit just the values array
    this.output_events.emit('values', values, query_options);

    // calculate result (Avg, Min or Max)
    switch (this.options.calculation || 'avg') {
        case "avg": var result = calculateAvg(values); break;
        case "min": var result = calculateMin(values); break;
        case "max": var result = calculateMax(values); break;
    }

    // emit the calculated result
    this.output_events.emit('result', result, query_options);
}

// gets maximum value from the array
function calculateMax(array) {
    return array.reduce(function(max, elem) {
        return (elem > max) ? elem : max;
    }, array[0]);
}

 // gets minimum value from the array
function calculateMin(array) {
    return array.reduce(function(min, elem) {
        return (elem < min) ? elem : min;
    }, array[0]);
}

// calculates the Average of all values in the array
function calculateAvg(array) {
    var sum = array.reduce(function(sum, elem) {
        return sum + elem;
    }, 0);

    return parseFloat((sum / array.length).toFixed(4));
}