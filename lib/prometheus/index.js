var Url     = require('url'),
    Path    = require('path'),
    Sprintf = require('util').format;
    encodeURIComponent = require('querystring').escape;

// prepare params for Http.request
module.exports.getRequestParams = function(options, app_options) {
    var params = Url.parse(app_options.prometheus_url);
    params.path = Sprintf('/api/v1/query?query=%s&time=%s&_=%s',
        encodeURIComponent(options.query),
        options.time || "",
        Date.now()
    );

    return {
        // temporary, query string for post data
        _pd:      null,

        // will be passed to Http.request
        protocol: params.protocol,
        hostname: params.hostname,
        port:     params.port,
        path:     Path.normalize(params.path),
        auth:     app_options.prometheus_auth,
        method:   'GET',
        headers: {
            'Accept': 'application/json, text/javascript'
        }
    }
}

// takes the result of Prometheus query API, merges it and extracts
// just the values, the final result: array of values (excluding nulls)
// format: https://prometheus.io/docs/querying/api/#instant-queries
module.exports.getValues = function(result) {
    if (result.status !== "success") {
        throw new Error("unsuccessfull query result, status: " + result.status)
    }

    if (result.data.resultType !== "vector") {
        throw new TypeError("unsupported result type: " + result.data.resultType)
    }

    // 1: concatinate the result array
    var array = result.data.result, merged = [];
    for (var i = 0; i < array.length; i++) {
        merged = merged.concat(parseFloat(array[i].value[1]));
    }

    // 2: strip nulls/NaNs from the array
    return merged.filter(function(elem) {
        return elem !== null && !isNaN(elem);
    });
}
