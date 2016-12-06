var Http    = require('http'),
    Https   = require('https'),
    Url     = require('url'),
    Path    = require('path');

// constructor
var Query = module.exports = function(app, options) {

    // collect required information
    this.options        = options;
    this.events         = app.events;
    this.log            = app.log.subLogger();
    this.request_params = app.query_engine.getRequestParams(options, app.options);
    this.query_engine   = app.query_engine;

    // all logs messages will contain query name
    this.log.setGlobal('query', this.options.name);

    var delay = 0;
    if (app.options.splay) {
        // get random number between 1000 (1 second) and query interval
        delay = Math.random() * (app.options.interval - 1000) + 1000 | 0;
        this.log.info("delaying initial query by", delay, "ms");
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
    this.events.on('completed', function(options) {
        if (options.name === self.options.name) {
            self.log.debug('query completed, sleeping for', interval, 'ms');
            setTimeout(self.executeQuery.bind(self), interval);
        }
    });
}

Query.prototype.executeQuery = function() {
    var json = new Buffer(0),
        self = this,
        req  = createRequest(this.request_params); // make request

    this.log.debug('executing query', { request: this.request_params });

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

    this.log.error("query failed", {error: err.message});

    // emit final event, to indicate that the query completed
    this.events.emit('completed', this.options);
}

Query.prototype.onSuccess = function(data) {
    // always emit raw data
    this.events.emit('raw', data, this.options);

    try {
        // get the values from the result
        var values = this.query_engine.getValues(data);
        this.log.debug("got values", { values: values, count: values.length });
    }
    catch(err) {
        // or bail out
        this.onError(err);
        return;
    }

    if (values.length > 0) {
        // emit just the values array
        this.events.emit('values', values, this.options);
    }
    else {
        // do not calculate empty values array
        this.log.warn("query doesn't contain any data-points");
    }

    // emit final event, to indicate that the query completed
    this.events.emit('completed', this.options);
}

// internal function to create HTTP/HTTPS request
function createRequest(params) {
    var client = (params.protocol === 'https:') ? Https : Http;
    return client.request(params);
}
