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

- Complete README (for now, read sources)
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

### How to install run?

> **This is incomplete quick and dirty getting started guide, the README file updated frequently until it fully completed**

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
