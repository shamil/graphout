var Glob      = require('glob'),
    Cjson     = require('cjson'),
    Validator = require('jsonschema'),
    schema    = require('./config-schema');

var Config = module.exports = function(file) {

    var defaults = {
        interval:  60 * 1000, // every minute
        log_file:  "/tmp/graphout.log",
        log_level: "info",
        include:   []
    };

    try {
        // load the config file, and apply defaults
        var conf = Cjson.load(file);
        conf = Cjson.extend(defaults, conf);

        // load includes if any
        if (conf.include.length > 0) {
            var includes = [];

            // expand all the globs in includes
            for (var i = 0; i < conf.include.length; i++) {
                includes = includes.concat(Glob.sync(conf.include[i]));
            }

            // load includes and merge them to parent conf
            conf = Cjson.extend(true, conf, Cjson.load(includes, {merge: true}));
        }

        // lastly, validate the config
        validateConf(conf);
    }
    catch (err) {
        console.error(err.message);
        process.exit(1);
    }

    // return the config Object
    delete conf.include;
    return conf;
};

function validateConf(conf) {
    result = Validator.validate(conf, schema, {throwError: false, propertyName: 'graphout'});

    if (!result.valid) {
        for (var i = 0; i < result.errors.length; i++) {
            console.error("invalid config [path=%s]: %s", result.errors[i].property, result.errors[i].message);
            //console.error(result.errors[i]);
        }
        throw new Error('configuration validation failed!');
    }
}
