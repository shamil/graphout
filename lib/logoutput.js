/**
 * a simple output, that logs each query to a file
 */

// constructor
var LogOutput = module.exports = function(events, logger, params) {
    var target = new logger.Bristol();

    // configure the logger
    target.addTarget('file', {file: params.path}).withFormatter('commonInfoModel');
    target.addTransform(function(elem) {
        // do not print file/line
        if (elem.file) return {};
        return null;
    });

    events.on('max', function(result, options) {
        target.info({max: result}, options);
    });

    events.on('failed', function(err) {
    });
};
