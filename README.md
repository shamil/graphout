### What is Graphout

Graphout lets you forward `Graphite` based queries (using the render API) out to different external services.

```
The project still in ALPHA stage, be carefull when you use it in production!
Submit issues and/or suggestions. Pull requests are always welcome.
```

### Why?

Graphite collects metrics, this is very cool, but how can I make use of those metrics? And not just
for visualising them. What if I have a central monitoring system like `Zabbix`, that responsible to
send alerts, and I want to alert based on `Graphite` data? Or what if I want to do AWS Auto-scaling
based on graphite data? How can I get this data into CloudWatch? I'm sure you have your own reasons
to get this data out of Graphite to some external tool or service.

So, I decided that I need something that can answer the above questions.
**This is how Graphout was started.**

### Features

- Can take any query from Graphite render API
- HTTPS and HTTP basic authentication
- Average, maximum and minimum calculation (per query)
- Log, Zabbix and CloudWatch outputs
- New output modules very easy to write

### TODO

- Complete README
- Create Upstart and Systemd service scripts
- Allow set interval per query
- Write unit tests
- Nice to have: add option in outputs configuration to filter queries
- Nice to have: prepare a `puppet` module

### Configuration

Configuration is a typical `JSON` files, with one addition that you can have comemnts in it.
Also you can include configuration files from master config. See `include` option.
The configuration file(s) validated using JSON schema, so invalid configuration properties will cause Graphout to exit immediately.

**Minimal configuration**

- `graphite_url` is mandatory
- at least one `query` must be configured
- at least one `output` mist be configured

**Example**

```json
{
    "graphite_url": "http://graphite.example.com:8080",
    "queries":
    {
        "go-carbon.updateOperations":
        {
            "query": "sumSeries(carbon.agents.*.persister.updateOperations)",
            "from": "-1min",
            "until": "now"
        }
    },

    "outputs":
    {
        "logfile":
        {
            "output": "./logoutput",
            "params": {
                "path": "/tmp/logoutput.log"
            }
        }
    }
}
```

**Available configuration options**

**`graphite_url`**

URL to the graphite-web. The option must conform to the `URI` format.

**`graphite_auth`**

HTTP basic authentication option in `<username>:<password>` format

**`interval`**

Query interval in seconds, default is 60 seconds

**`log_file`**

Full path to the log file, default is `/var/log/graphout/graphout.log`.
Set this to `/dev/stdout` to print to console.

**`log_level`**

Minimal log level that will be printed, default is `info`.
Available levels are: `error`, `warn`, `info` and  `debug`.

**`splay`**

Delay each query by consistent random of seconds.
If enabled, delay between 1 second and the query interval.

**`queries`**

Queriy objects, accepted by [Graphite Render URL API](http://graphite.readthedocs.org/en/latest/render_api.html#json).

The format is:

```javascript
// unique query-name 
"go-carbon.updateOperations":
{
    // the graphite target
    "query": "sumSeries(carbon.agents.*.persister.updateOperations)",

    // relative or absolute time period
    "from": "-1min",

    // relative or absolute time period
    "until": "now",

    // the calulation method of the received Graphite data
    // available methods: "avg", "min", "max"
    // default: "avg"
    "calculation": "avg"
}
```

For more info read the Graphite Render URL API manual. 

Note that, Graphout uses the [**`maxDataPoints`**](http://graphite.readthedocs.org/en/latest/render_api.html#maxdatapoints) API option,
to return 60 consolidated data points at most. The `maxDataPoints` option available since Graphite 0.9.13.
So it's best that you have the latest version of Graphite-Web.

**`outputs`**

Output objects. The format is:

```javascript

// Alphanumeric output name, with dots and hypens allowed as well
"logfile":
{
    // ouput module name, Graphaut will use "require" to load the module
    "output": "./logoutput",

    // "params" properties are dependant on the "output" type (module)
    "params": {
        "path": "/tmp/logoutput.log"
    }
}
```

### Outputs

Each output is a Node.js module. The only exception is a built-in `logoutput` output, which is part of this project.
The other currently available outputs are `Zabbix` and 'CloudWatch', they are separate Node.js packages. Those outputs are dependencies
of this project, so they're installed automatically when you install **Graphout**.

**`logoutput`**

The only param for this output is `path`, to the log file where all queries results will be written to.

Other outputs documentation:

- [Zabbix](https://github.com/shamil/graphout-output-zabbix) output
- [CloudWatch](https://github.com/shamil/graphout-output-cloudwatch) output

### How to install, and run?

**Install**

    # npm install -g graphout

**Usage**

    # graphout --help
    usage: graphout --config <config-path> --pid <pid-path>

**Run**

First, copy the example `graphout.example.json` configuration file to `/etc/graphout/graphout.json`.
The example file, should be located in node 'lib/node_modules/graphout' directory, relative to the 
node's install root.

Second, change the config to meet your graphite settings, then you can run graphout...

    # graphout --pid /tmp/graphout.pid --config /etc/graphout/graphout.json

**Result**

If all good, you should at least see data goes to a file (`/tmp/logoutput.log`) written
by the `logoutput` module. If not, try to set `log_level` to `debug` in config or post your issues
and I'll try to help you getting started.

### Internal architecture

![dagram](https://raw.githubusercontent.com/shamil/graphout/master/diagram.png)

### License

Licensed under the MIT License. See the LICENSE file for details.
