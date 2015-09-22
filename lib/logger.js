var Bristol = require('bristol');

// Inherit from bristol
function Logger() { Bristol.Bristol.call(this); }
require("util").inherits(Logger, Bristol.Bristol);

// we don't need origins (file/line)
Logger.prototype._getOrigin = function() {
    return {};
}

// support for sub/child loggers
// all sub loggers will get same settings from parent logger, excluding globals
Logger.prototype.subLogger = function() {
    var subLogger = new Logger();

    subLogger._targets    = this._targets;
    subLogger._transforms = this._transforms;
    subLogger.setSeverities(Object.keys(this._severities));

    return subLogger;
}

module.exports = new Logger();
module.exports.Instance = Logger;
