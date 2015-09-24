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

For those reasons I decided that I need something that can answer the above questions.
**This is how Graphout was born.**

### What's done

- The intended flow works as designed/planned
- A simple output module, that outputs to log file (embedded)
- A CloudWatch output module, ([as separate module](https://github.com/shamil/graphout-output-cloudwatch))
- A Zabbix output module, that outputs to zabbix server ([as separate module](https://github.com/shamil/graphout-output-zabbix))

### TODO

- Complete README (for now, read sources)
- Create Upstart and Systemd service scripts
- Allow set interval per query
- Write unit tests
- Nice to have: add option in outputs configuration to filter queries
- Nice to have: prepare a `puppet` module

### How to install run?

> **This is incomplete quick and dirty getting started guide, the README file will be rewritten with full documentation!**

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

### License

Licensed under the MIT License. See the LICENSE file for details.
