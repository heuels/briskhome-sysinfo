/**
 * Briskhome system monitor <briskhome-sysmon.js>
 * Part of Briskhome house monitoring service.
 *
 * Based on 'os-monitor' package by lfortin
 * (https://github.com/lfortin/node-os-monitor)
 *
 * @author Egor Zaitsev <ezaitsev@briskhome.com>
 * @version 0.3.0
 */

'use strict';

const events = require('events');
const exec = require('child_process').exec;
const util = require('util');
const fs = require('fs');
const os = require('os');

const processes = require('current-processes');
const leases = require('dhcpd-leases');
const async = require('async');

const is = require('@briskhome/helper');

// Loads configuration from a unified storage. Planned feature.
// const default = require('@briskhome/config');

const DEFAULT_CONFIG = {
  interval: 5000,
  silent: false,
  verbose: true,
  threshold: {
    loadavg: os.cpus().length,
    freehdd: 0.5,
    freemem: 50,
    uptime: 50,
  },
};

/**
 * The Sysmon class defines a system monitor object capable of checking
 * the following server stats: total and available RAM, available disk space,
 * average CPU load, system uptime, etc.
 *
 * @constructor
 */
function Sysmon() {
  /*
    In the constructor of Sysmon object, we use the call() method of
    EventEmitter object, which executes the constructor method of EventEmitter.
  */
  events.EventEmitter.call(this);
  this._state = {
    running: false,
    stopped: false,
    interval: undefined,
    config: Object.assign({}, DEFAULT_CONFIG),
  };
}

util.inherits(Sysmon, events.EventEmitter);

/**
 * Emits an event when something happens.
 *
 * Note the code below that adds timestamp to the event object. Javascript
 * uses the number of milliseconds since epoch, Unix timestamp, on the other
 * hand, uses seconds since epoch.
 *
 * @param {string} event Name of the event that occured during the execution of
 *        the library.
 * @param {object} obj Current set of captured stats.
 */
Sysmon.prototype.sendEvent = function(event, obj) {
  var curtime = Math.floor(+Date.now() / 1000);
  var eventObj = Object.assign({
    timestamp: curtime,
  }, obj);
  this.emit(event, eventObj);
};

/**
 * Starts system state monitor.
 *
 * Amount of output can be tuned by setting the 'silent' option of the
 * configuration to 'true'. This makes it so that 'status' events are not fired.
 *
 * Parameters, including critical values, are loaded from configuration object
 * if present or from a default configuration object.
 *
 * @todo Validate this function with 'let' instead of 'var' with JSHint.
 *
 * @param {Array} options A set of options passed from the declaration.
 * @returns {Sysmon}
 */
Sysmon.prototype._start = function(options) {
  // Calling stop() here clears the old interval.
  // Configuration happens once only right after the creation of instance.
  this.stop();
  this.config(options);

  /**
   * @function main()
   * Asynchronously collects server information and creates a valid JSON object
   * which is in turn passed for checking against critical values.
   */
  var main = function collect() {
    async.parallel({
      disks: (callback) => {
        this.df(null, callback);
      },
      processes: (callback) => {
        // TODO: Remove limit, leave just sort by reversed 'cpu'.
        // TODO: Test values should be added from environment config.
        this.ps({ sort: 'cpu', limit: '5', reverse: true }, callback);
      },
      leases: (callback) => {
        // TODO: Test values should be added from environment config.
        this.dhcp({ file: './dhcpd.leases' }, callback);
      },
      services: (callback) => {
        this.services(null, callback);
      },
    },
    function(err, data) {
      if (err) {
        throw err;
      }
      let result = {
        hostname: os.hostname(),
        system: {
          uptime: os.uptime(),
          cpu: {
            loadavg: os.loadavg()[0],
            loadavg5: os.loadavg()[1],
            loadavg15: os.loadavg()[2],
          },
          memory: {
            free: os.freemem(),
            used: os.totalmem() - os.freemem(),
            total: os.totalmem(),
          },
          disks: [
            data.disks,
          ],
          processes: [
            data.processes,
          ],
          services: [
            data.services,
          ],
        },
        network: {
          interfaces: os.networkInterfaces(),
          leases: data.leases,
        },
      };
      review(JSON.stringify(result));
    });
  }.bind(this);

  /**
   * @function review()
   * Sends server information in JSON as 'monitor' event. Compares server
   * information against preset critical values.
   */
  var review = function review(data) {
    // Critical values by default are supplied for the following:
    console.log(data);
    // let critical = [];
    // let config = this.config();
    // let freemem = (config.threshold.freemem < 1)
    //   ? config.threshold.freemem * data.totalram
    //   : config.threshold.freemem;
    // if (data.system.cpu.loadavg > config.loadavg[0]) {
    //   critical.push('loadavg');
    // }
    // if (data.system.cpu.loadavg5 > config.loadavg[1]) {
    //   critical.push('loadavg5');
    // }
    // if (data.system.cpu.loadavg15 > config.loadavg[2]) {
    //   critical.push('loadavg15');
    // }
    // if (data.system.memory.free > freemem) {
    //   critical.push('freemem');
    // }
    // if (data.system.uptime > config.uptime) {
    //   critical.push('uptime');
    // }
    // // TODO: Default all hard disk critical value.
    // data.critical = critical || [];
    // this.sendEvent('state', Object.assign({
    //   type: 'state',
    // }, data));

  }.bind(this);

  if (!this.config().interval) {
    process.nextTick(main);
  } else {
    this._state.interval = setInterval(main, this.config().interval);
  }

  if (!this._state.running) {
    this._state.running = true;
    this.sendEvent('start', {
      type: 'start',
    });
  }
};

Sysmon.prototype.start = function(options) {
  var _this = this;
  if (_this._isStopped()) {
    throw new Error('briskhome-sysmon has been destroyed by .destroy() method');
  }
  if (options) {
    //
  }
  _this.stop();
  _this.config(options);
  var main = function() {
    var data = {
      loadavg: os.loadavg(),
      uptime: os.uptime(),
      freemem: os.freemem(),
      totalram: os.totalmem(),
    };
    var config = _this.config();
    var freemem = (config.threshold.freemem < 1)
      ? config.threshold.freemem * data.totalram
      : config.threshold.freemem;
    if (!config.silent) {
      _this.sendEvent('event', Object.assign({
        type: 'regular',
      }, data));
    }
    if (data.loadavg[0] > config.threshold.loadavg[0]) {
      _this.sendEvent('threshold-loadavg1', Object.assign({
        type: 'threshold-loadavg1',
      }, data));
    }
    if (data.loadavg[1] > config.threshold.loadavg[1]) {
      _this.sendEvent('threshold-loadavg5', Object.assign({
        type: 'threshold-loadavg5',
      }, data));
    }
    if (data.loadavg[2] > config.threshold.loadavg[2]) {
      _this.sendEvent('threshold-loadavg15', Object.assign({
        type: 'threshold-loadavg15',
      }, data));
    }
    if (data.freemem < freemem) {
      _this.sendEvent('threshold-freemem', Object.assign({
        type: 'threshold-freemem',
      }, data));
    }
    if ((_this._sanitizeNumber) && (data.uptime > _this._sanitizeNumber)) {
      _this.sendEvent('threshold-uptime', Object.assign({
        type: 'threshold-uptime',
      }, data));
    }
  };

  if (_this.config().loop) {
    process.nextTick(main);
  }

  _this._state.interval = setInterval(main, _this.config().interval);
  if (!_this.isRunning()) {
    _this._state.running = true;
    _this.sendEvent('start', {
      type: 'start',
    });
  }
  return _this;
};

/**
 * Stops execution of Sysmon instance. Clears the interval that was set for
 * execution of main() function and emits a 'stop' event.
 */
Sysmon.prototype.stop = function() {
  clearInterval(this._state.interval);
  if (this._state.running) {
    this._state.running = false;
    this.sendEvent('stop', {
      type: 'stop',
    });
  }
  return this;
};

/**
 * Restarts and reconfigures Sysmon instance.
 */
Sysmon.prototype.reset = function() {
  this.sendEvent('reset', {
    type: 'reset',
  });
  this[this._state.running ? 'start' : 'config']
    (Object.assign({}, DEFAULT_CONFIG));
  return this;
};

/**
 * Configuration function. If module configuration is passed as an argument
 * then is parsed applied to the corresponding Sysmon object. If no arguments
 * present then it returns default or already installed configuration.
 *
 * @param {Object} options Configuration object. Naming scheme can be viewed at
 *        the begginning of the file in DEFAULT_CONFIG declaration.
 * @returns {Object} Configuration of the current Sysmon instance.
 */
Sysmon.prototype.config = function(options) {
  var _this = this;
  if (options) {
    _this._sanitizeConfig(options, function(err, options) {
      if (err) {
        throw new Error(err);
      }
      Object.assign(_this._state.config, options);
      _this.sendEvent('config', {
        type: 'config',
        config: Object.assign({}, options),
      });
    });
  }
  return _this._state.config;
};

Sysmon.prototype._sanitizeConfig = function(options, callback) {
  if (options.constructor !== Object) {
    callback('Configuration object is of wrong type.');
  }
  if ('interval' in options && !is.number(options.interval)) {
    callback('Option \'interval\' should be a number.');
  }
  if ('silent' in options && typeof options.silent !== 'boolean') {
    callback('Option \'silent\' should be a boolean.');
  }
  if ('loop' in options && (typeof options.loop !== 'boolean')) {
    callback('Option \'loop\' should be a boolean.');
  }
  if ('threshold' in options && (options.threshold.constructor !== Object)) {
    callback('Option \'threshold\' should be an object.');
  }
  if ('threshold' in options && 'freemem' in options.threshold) {
    var freemem = options.threshold.freemem;
    if (/(^\d+$|^0\.\d+$)/.test(freemem) === false) {
      callback('Option \'freemem\' should be a Number.');
    }
  }
  if ('threshold' in options && 'uptime' in options.threshold) {
    var uptime = options.threshold.uptime;
    if (!is.number(uptime)) {
      callback('Option \'uptime\' should be a Number.');
    }
  }
  if ('threshold' in options && 'loadavg' in options.threshold) {
    var loadavg = options.threshold.loadavg;
    if (is.number(loadavg)) {
      options.threshold.loadavg = [loadavg, loadavg, loadavg];
    } else if (loadavg.constructor === Array) {
      if (loadavg.length !== 3 || loadavg.every(function(item) {
        if (!is.number(item)) {
          callback('Option \'loadavg\' should be a Number or an Array.');
        }
      }, this)) {
        callback('Option \'loadavg\' should contain an Array with 3 items.');
      }
    } else {
      callback('Option \'loadavg\' should be a Number or an Array.');
    }
  }
  callback(null, options);
};

module.exports = new Sysmon();
module.exports.Sysmon = Sysmon;

/* Below this line are WIP functions. */
// TODO: Move these functions to the top.

/**
 * Wrapper for 'ps' Unix program. Displays the currently-running processes.
 * Uses 'current-processes' module.
 *
 * @param {Object} options.
 * @param {Fucntion} callback.
 *
 * @callback
 * @param {Error} err.
 * @param {Array} data.
 */
Sysmon.prototype.ps = function(options, callback) {
  let sort = (options && 'sort' in options)
    ? options.sort
    : 'cpu';
  let limit = (options && 'limit' in options)
    ? options.limit
    : 0;
  let reverse = (options && 'reverse' in options)
    ? options.reverse
    : false;

  if (!['cpu', 'mem', 'pid', 'name'].includes(sort)) {
    let err = new Error('Sort parameter ' + sort + ' is incorrect.');
    return callback(err);
  }

  if (isNaN(parseFloat(limit)) && !isFinite(limit)) {
    let err = new Error('Limit parameter should be a number.');
    return callback(err);
  }

  if (typeof reverse !== 'boolean') {
    let err = new Error('Reverse parameter should be a boolean.');
    return callback(err);
  }

  processes.get(function(err, data) {
    if (typeof sort === 'string' || sort instanceof String) {
      data.sort(function(a, b) {
        return (a[sort] > b[sort]) - (a[sort] < b[sort]);
      });
    } else {
      data.sort(function(a, b) {
        return parseFloat(a[sort].usage) - parseFloat(b[sort].usage);
      });
    }

    data = reverse
      ? data.reverse()
      : data;
    limit = data.length >= limit
      ? limit
      : 0;
    data = (limit > 0)
      ? data.slice(0, limit)
      : data;
    return callback(null, data);
  });
};

/**
 * Wrapper for 'df' Unix program. Displays disk usage information.
 * Uses 'child_process' module.
 *
 * @param {String} options.
 * @param {Function} callback.
 *
 * @callback
 * @param {Error} err.
 * @param {Array} data.
 */
Sysmon.prototype.df = function(options, callback) {
  // 'options' should not be used?
  options = (typeof options === 'string' || options instanceof String)
    ? options
    : null;
  let command = (os.platform().toLowerCase() === 'darwin')
    ? 'df -k'
    : 'df';
  exec(command, (err, stdout) => {
    if (err) {
      return callback(err);
    }

    const regexp = /^(\/\S+)\s+\S+\s+(\d+)\s+(\d+)\s+(\d+)/gi;
    let result = {};
    let data = stdout.split('\n');
    data.splice(0, 1);
    data.splice(-1, 1);
    data.forEach(string => {
      if (string.charAt(0) !== '/') {
        return;
      }

      let matches = regexp.exec(string);
      result[matches[1]] = {};
      result[matches[1]].used = matches[2];
      result[matches[1]].free = matches[3];
      result[matches[1]].percent = matches[4];
    });

    return callback(null, result);
  });
};

/**
 * Returns dhcp leases.
 * Uses 'dhcpd-leases' module.
 *
 * @param {String} options.
 * @param {Function} callback.
 *
 * @callback
 * @param {Error} err.
 * @param {Array} data.
 */
Sysmon.prototype.dhcp = function(options, callback) {
  let file = (options && 'file' in options) // && file !== ''  // TODO: cb(err).
    ? options.file
    : '/var/lib/dhcp/dhcpd.leases';
  let encoding = (options && 'encoding' in options) // FIXME: use encoding.
    ? options.encoding
    : null;
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) {
      return callback(err);
    }

    let result = leases(data);
    return callback(null, result);
  });
};

/**
 * Returns list of services and their status.
 * Uses 'child_process' module.
 *
 * @param {String} options.
 * @param {Function} callback.
 *
 * @callback
 * @param {Error} err.
 * @param {Object} data.
 */

Sysmon.prototype.services = function (options, callback) {
  options = (typeof options === 'string' || options instanceof String)
    ? options
    : null;
  let command = (os.platform().toLowerCase() === 'darwin')
    ? 'cat ./services'
    : 'sudo services --status-all';
  exec(command, (err, stdout, stderr) => {
    if (err) {
      return callback(err);
    }

    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    const regexp = /\s\[\s([\+\-\?])\s\]\s+([a-z0-9\+\-]+)/gim;
    let result = {};
    let data = stdout.split('\n');
    data.forEach(string => {
      let matches = regexp.exec(string);
      console.log('matches: ' + matches);
      if (!matches) {
        return;
      }

      if (matches && matches[1] === '+') {
        result[matches[2]] = true;
      } else if (matches && matches[1] === '-') {
        result[matches[2]] = false;
      } else {
        result[matches[2]] = null;
      }
    });

    callback(null, result);
  });
};

/**
 * Extends Array class with 'includes' method that checks
 * whether a given object exists in array.
 *
 * @extends Array
 * @param {Object} obj.
 */
Array.prototype.includes = function(obj) {
  var i = this.length;
  while (i--) {
    if (this[i] === obj) {
      return true;
    }
  }

  return false;
};
