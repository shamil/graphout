var Http    = require('http'),
    Https   = require('https'),
    Url     = require('url'),
    Path    = require('path'),
    Sprintf = require('util').format;

// constructor
var Query = module.exports = function(app, options) {

    // collect required information
    this.options        = options;
    this.logger         = app.logger;
    this.events         = app.events;
    this.url            = app.options.graphite_url;
    this.auth           = app.options.graphite_auth;
    this.request_params = this.getRequestParams();

    var delay = 0;
    if (app.options.splay) {
        // get random number between 1000 (1 second) and query interval
        delay = Math.random() * (app.options.interval - 1000) + 1000 | 0;
        this.logger.info("delaying initial query by", delay, "ms", {query: this.options.name});
    }

    // initial query with splay delay (if enabled)
    setTimeout(this.executeQuery.bind(this), delay);

    // start the query loop
    this.loop(app.options.interval);
}

// the query loop, which executes query each interval
Query.prototype.loop = function(interval) {
    var self = this;

    // new query only after the last one completed
    this.events.on('completed', function(opts) {
        if (opts.name === self.options.name) {
            self.logger.debug('query completed, sleeping for', interval, 'ms', {query: opts.name});
            setTimeout(self.executeQuery.bind(self), interval);
        }
    });
}

// prepare params for Http.request
Query.prototype.getRequestParams = function() {
    var params = Url.parse(Sprintf('%s/render?format=json&maxDataPoints=60from=%s&until=%s&target=%s',
            this.url,
            this.options.from,
            this.options.until,
            this.options.query
        ));

    return {
        // temporary, query string for post data
        _pd:      params.query,

        // will be passed to Http.request
        protocol: params.protocol,
        hostname: params.hostname,
        port:     params.port,
        path:     Path.normalize(params.pathname),
        auth:     this.auth,
        method:   'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': params.query.length
        }
    }
}

Query.prototype.executeQuery = function() {
    var json  = new Buffer(0),
        self  = this,
        req   = createRequest(this.request_params); // make request

    this.logger.debug('executing query', {query: this.options.name});

    // abort on timeout
    req.setTimeout(5000, function() {
        req.abort();
    });

    // finish the request by POSTing the query
    req.end(this.request_params._pd);

    req.on('response', function(res) {
        var status       = res.statusCode,
            content_type = res.headers['content-type'];

        // collect response chunks
        res.on('data', function(chunk) {
            json = Buffer.concat([json, chunk]);
        });

        // parse the data after it was retrieved
        res.on('end', function() {
            // make sure we got "200 OK" from the response
            if (status != 200) {
                self.onError(new Error("bad HTTP status (" + status + ")"));
                return;
            }

            // make sure we got json data (application/json) from response
            if (content_type.indexOf('json') < 0) {
                self.onError(new Error("bad Content-Type (" + content_type + ")"));
                return;
            }

            self.onSuccess(JSON.parse(json.toString()));
        });
    });

    // deal with errors
    req.on('error', function(err) {
        self.onError(err);
    });
}

Query.prototype.onError = function(err) {
    if (err.code === "ECONNRESET") {
        err.message = "request timed out";
    }

    this.logger.error("query failed,", err.message, {code: err.code, query: this.options.name});

    // emit failed event, with the error
    this.events.emit('failed', err, this.options);

    // emit final event, to indicate that the query completed
    this.events.emit('completed', this.options);
}

Query.prototype.onSuccess = function(result) {
    this.logger.debug("query succeeded", {query: this.options.name});

    // emit raw result (in case some output needs it)
    this.events.emit('result', result, this.options);

    // get the values from the result
    var values = getValues(result);

    // emit just the values array
    this.events.emit('values', values, this.options);

    // now emit results for each calculation (Min, Max and Avg)
    this.events.emit('min', calculateMin(values), this.options);
    this.events.emit('max', calculateMax(values), this.options);
    this.events.emit('avg', calculateAvg(values), this.options);

    // emit final event, to indicate that the query completed
    this.events.emit('completed', this.options);
}

// internal function to create HTTP/HTTPS request
function createRequest(params) {
    var client = (params.protocol === 'https:') ? Https : Http;
    return client.request(params);
}

// takes an array in *Graphite* format, merges it and extracts
// just the values, the final result: array of values (excluding nulls)
// format: http://graphite.readthedocs.org/en/latest/render_api.html#json
function getValues(array) {
    // 1: concatinate the arrays
    var merged = [];
    for (i = 0; i < array.length; i++) {
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
