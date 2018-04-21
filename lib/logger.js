var Bristol = require('bristol');

class Logger extends Bristol.Bristol {

    // we don't need origins (file/line)
    _getOrigin() {
        return {};
    }

    // support for sub/child loggers
    // all sub loggers will get same settings from parent logger, excluding globals
    subLogger() {
        var subLogger = new Logger();

        subLogger._targets    = this._targets;
        subLogger._transforms = this._transforms;
        subLogger.setSeverities(Object.keys(this._severities));

        return subLogger;
    }
}

module.exports = new Logger();
module.exports.Instance = Logger;
