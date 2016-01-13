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

const async = require('async');
const df = require('node-diskfree');
const ps = require('current-processes');
const leases = require('dhcpd-leases');

const DEFAULT_CONFIG = {
  loop: false,
  delay: 5000,
  silent: false,
  verbose: true,
  threshold: {
    loadavg: os.cpus().length,
    freehdd: 0.5,
    freeram: 50,
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
    delay: undefined,
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
 * Starts Sysmon instance.
 * Checks the server stats and emits events when necessary.
 *
 * Amount of output can be tuned by setting the 'silent' option of the
 * configuration to 'true'. If options array is present, then configuration is
 * loaded from it. If no argument is passed then default configuration loaded.
 *
 * @param {Array} options A set of options passed from the declaration.
 * @returns {Sysmon}
 */
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
  var _main = function() {
    async.series([
      function(err, callback) {
        // 1.
      },
      function(err, callback) {
        // 2.
      },
    ],
    function(err, results) {
      // This will be called after 1&2 are complete or in case of an error.
    });
  };
  var __main = function() {
    async.series({
      hostname: os.hostname(),
      uptime: os.uptime(),
      cpu: {
        loadavg: os.loadavg()[0],
        loadavg5: os.loadavg()[1],
        loadavg15: os.loadavg()[2],
      },
      ram: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      hdd: this.df(),
      ps: {
        cpu: this.ps('cpu', 5),
        ram: this.ps('ram', 5),
      },
      network: {
        interfaces: os.networkInterfaces(),
        leases: this.leases(),
      },
    },
    function(err, result) {
      // Resulting object.
    });
  };

  var main = function() {
    var data = {
      loadavg: os.loadavg(),
      uptime: os.uptime(),
      freeram: os.freemem(),
      totalram: os.totalmem(),
    };
    var config = _this.config();
    var freeram = (config.threshold.freeram < 1)
      ? config.threshold.freeram * data.totalram
      : config.threshold.freeram;
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
    if (data.freeram < freeram) {
      _this.sendEvent('threshold-freeram', Object.assign({
        type: 'threshold-freeram',
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
  _this._state.interval = setInterval(main, _this.config().delay);
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
  if (this.isRunning()) {
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
  this[this.isRunning() ? 'start' : 'config']
    (Object.assign({}, DEFAULT_CONFIG));
  return this;
};

/**
 * Destroys Sysmon instance and emits a 'destroy' event.
 */
Sysmon.prototype.destroy = function() {
  if (!this._isStopped()) {
    this.sendEvent('destroy', {
      type: 'destroy',
    });
    this.stop();
    this._state.stopped = true;
  }
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

/**
 * Checks whether Sysmon is active and running.
 *
 * @returns {Boolean} status True = running, false = stopped.
 * @private
 */
Sysmon.prototype.isRunning = function() {
  return !!this._state.running;
};

/**
 * Checks whether Sysmon is destroyed.
 *
 * @returns {Boolean} status True = destroyed, false = active.
 * @private
 */
Sysmon.prototype._isStopped = function() {
  return !!this._state.stopped;
};

/**
 * Various helper methods.
 * The main function checks whether an argument is an acceptable number.
 * Additional functions help quickly convert timestamps to any measure possible.
 *
 * @param {Number} n A number that should be sanitized or converted.
 */
Sysmon.prototype.isNumeric = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

module.exports.df = df;

Sysmon.prototype._sanitizeConfig = function(options, callback) {
  if (options.constructor !== Object) {
    callback('Configuration object is of wrong type.');
  }
  if ('delay' in options && !this.isNumeric(options.delay)) {
    callback('Option \'delay\' should be a number.');
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
  if ('threshold' in options && 'freeram' in options.threshold) {
    var freeram = options.threshold.freeram;
    if (/(^\d+$|^0\.\d+$)/.test(freeram) === false) {
      callback('Option \'freeram\' should be a Number.');
    }
  }
  if ('threshold' in options && 'uptime' in options.threshold) {
    var uptime = options.threshold.uptime;
    if (!this.isNumeric(uptime)) {
      callback('Option \'uptime\' should be a Number.');
    }
  }
  if ('threshold' in options && 'loadavg' in options.threshold) {
    var loadavg = options.threshold.loadavg;
    if (this.isNumeric(loadavg)) {
      options.threshold.loadavg = [loadavg, loadavg, loadavg];
    } else if (loadavg.constructor === Array) {
      if (loadavg.length !== 3 || loadavg.every(function(item, i, arr) {
        if (!this.isNumeric(item)) {
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

Sysmon.prototype.seconds = function(n) {
  return this._sanitizeNumber(n * 1000);
};

Sysmon.prototype.minutes = function(n) {
  return this._sanitizeNumber(n * this.seconds(60));
};

Sysmon.prototype.hours = function(n) {
  return this._sanitizeNumber(n * this.minutes(60));
};

Sysmon.prototype.days = function(n) {
  return this._sanitizeNumber(n * this.hours(24));
};

module.exports = new Sysmon();
module.exports.Sysmon = Sysmon;

/* Below this line are WIP functions. */

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
  callback = (typeof callback === 'function')
    ? callback
    : function() {};
  let sort = options && 'sort' in options
    ? options.sort
    : 'cpu';
  let limit = options && 'limit' in options
    ? options.limit
    : 0;
  let reverse = options && 'reverse' in options
    ? options.reverse
    : false;

  if (!['cpu', 'mem', 'pid', 'name'].includes(sort)) {
    callback('Sort parameter ' + sort + ' is incorrect.');
  }
  if (!this.isNumeric(limit)) {
    callback('Limit parameter should be a number.');
  }
  if (typeof reverse !== 'boolean') {
    callback('Reverse parameter should be a boolean.');
  }

  ps.get(function(err, data) {
    if (typeof sort === 'string' || sort instanceof String) {
      data.sort(function(a, b) {
        return (a[sort] > b[sort]) - (a[sort] < b[sort]);
      });
    } else {
      data.sort(function(a, b) {
        return parseFloat(a[sort].usage) - parseFloat(b[sort].usage);
      });
    }
    limit = data.length <= limit ? data.length : 0;
    data = limit > 0
      ? data.slice(0, limit)
      : data;
    data = reverse
      ? data.reverse()
      : data;
    callback(null, data);
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
  options = (typeof options === 'string' || options instanceof String)
    ? options
    : null;
  let command = (os.platform().toLowerCase() === 'darwin')
    ? 'df -k'
    : 'df';
  exec(command, (err, stdout, stderr) => {
    if (err) {
      callback(err.message);
    }
    const regexp = /^(\/\S+)\s+\S+\s+(\d+)\s+(\d+)\s+(\d+)/gi;
    let data = stdout.split('\n');
    data.splice(0, 1);
    data.splice(-1, 1);
    data.forEach(string => {
      if (string.charAt(0) !== '/') {
        return;
      }
      let matches = regexp.exec(string);
      let result = {};
      result[matches[1]] = {};
      result[matches[1]]['used'] = matches[2];
      result[matches[1]]['free'] = matches[3];
      result[matches[1]]['percent'] = matches[4];
      callback(null, result);
    });
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
  if (!options || !('file' in options) || (typeof options.file !== 'string')) {
    callback('Path to \'dhcp-leases\' is required as string.');
  }
  let file = options.file;
  let encoding = (options && 'encoding' in options)
    ? options.encoding
    : null;
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) {
      callback(err.message);
    }
    let result = leases(data);
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
  let i = this.length;
  while (i--) {
    if (this[i] === obj) {
      return true;
    }
  }
  return false;
};
