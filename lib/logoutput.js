/**
 * a simple output, that logs each query to a file
 */
var Logger = require('./logger');

// constructor
var LogOutput = module.exports = function(events, log, params) {
    var target = new Logger.Instance();

    // configure the logger
    target.addTarget('file', {file: params.path}).withFormatter('commonInfoModel');
    log.info("outputing to file", {file: params.path});

    events.on('result', function(result, options) {
        target.info({result: result}, options);
    });
};
