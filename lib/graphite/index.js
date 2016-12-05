var Url     = require('url'),
    Path    = require('path'),
    Sprintf = require('util').format;

// prepare params for Http.request
module.exports.getRequestParams = function(options, app_options) {
    var params = Url.parse(Sprintf('%s/render?format=json&maxDataPoints=60&from=%s&until=%s&target=%s',
            app_options.graphite_url,
            options.from,
            options.until,
            options.query
        ));

    return {
        // temporary, query string for post data
        _pd:      params.query,

        // will be passed to Http.request
        protocol: params.protocol,
        hostname: params.hostname,
        port:     params.port,
        path:     Path.normalize(params.pathname),
        auth:     app_options.graphite_auth,
        method:   'POST',
        headers: {
            'Accept': 'application/json, text/javascript',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': params.query.length
        }
    }
}

// takes an array in *Graphite* format, merges it and extracts
// just the values, the final result: array of values (excluding nulls)
// format: http://graphite.readthedocs.org/en/latest/render_api.html#json
module.exports.getValues = function(array) {
    // 1: concatinate the arrays
    var merged = [];
    for (var i = 0; i < array.length; i++) {
        merged = merged.concat(array[i].datapoints);
    }

    // 2: strip nulls from the array
    var no_nulls = merged.filter(function(elem) {
        return elem[0] !== null;
    });

    // 3: return array of values
    return no_nulls.map(function(elem) {
        return elem[0];
    });
}
