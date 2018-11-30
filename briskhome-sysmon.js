/**
 * Briskhome system monitor <briskhome-sysmon.js>
 * Part of Briskhome house monitoring service.
 *
 * @author Egor Zaitsev <ezaitsev@briskhome.com>
 * @version 0.2.0
 */

'use strict';

var events = require('events');
var util = require('util');
var os = require('os');

var DEFAULT_CONFIG = {
  loop: false,
  delay: 5000,
  silent: false,
  threshold: {
    loadavg: os.cpus().length,
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
  var eventObj = Object.assign(
    {
      timestamp: curtime,
    },
    obj,
  );
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
  var main = function() {
    var data = {
      loadavg: os.loadavg(),
      uptime: os.uptime(),
      freemem: os.freemem(),
      totalmem: os.totalmem(),
    };
    var config = _this.config();
    var freemem =
      config.threshold.freemem < 1
        ? config.threshold.freemem * data.totalmem
        : config.threshold.freemem;
    if (!config.silent) {
      _this.sendEvent(
        'event',
        Object.assign(
          {
            type: 'regular',
          },
          data,
        ),
      );
    }
    if (data.loadavg[0] > config.threshold.loadavg[0]) {
      _this.sendEvent(
        'threshold-loadavg1',
        Object.assign(
          {
            type: 'threshold-loadavg1',
          },
          data,
        ),
      );
    }
    if (data.loadavg[1] > config.threshold.loadavg[1]) {
      _this.sendEvent(
        'threshold-loadavg5',
        Object.assign(
          {
            type: 'threshold-loadavg5',
          },
          data,
        ),
      );
    }
    if (data.loadavg[2] > config.threshold.loadavg[2]) {
      _this.sendEvent(
        'threshold-loadavg15',
        Object.assign(
          {
            type: 'threshold-loadavg15',
          },
          data,
        ),
      );
    }
    if (data.freemem < freemem) {
      _this.sendEvent(
        'threshold-freemem',
        Object.assign(
          {
            type: 'threshold-freemem',
          },
          data,
        ),
      );
    }
    if (_this._sanitizeNumber && data.uptime > _this._sanitizeNumber) {
      _this.sendEvent(
        'threshold-uptime',
        Object.assign(
          {
            type: 'threshold-uptime',
          },
          data,
        ),
      );
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
  this[this.isRunning() ? 'start' : 'config'](
    Object.assign({}, DEFAULT_CONFIG),
  );
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
  var self = this;
  if (options) {
    self._sanitizeConfig(options, function(err, options) {
      if (err) {
        throw new Error(err);
      }
      Object.assign(self._state.config, options);
      self.sendEvent('config', {
        type: 'config',
        config: Object.assign({}, options),
      });
    });
  }
  return self._state.config;
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

Sysmon.prototype._sanitizeConfig = function(options, callback) {
  if (options.constructor !== Object) {
    callback('Configuration object is of wrong type.');
  }
  if ('delay' in options && !this.isNumeric(options.delay)) {
    callback("Option 'delay' should be a number.");
  }
  if ('silent' in options && typeof options.silent !== 'boolean') {
    callback("Option 'silent' should be a boolean.");
  }
  if ('loop' in options && typeof options.loop !== 'boolean') {
    callback("Option 'loop' should be a boolean.");
  }
  if ('threshold' in options && options.threshold.constructor !== Object) {
    callback("Option 'threshold' should be an object.");
  }
  if ('threshold' in options && 'freemem' in options.threshold) {
    var freemem = options.threshold.freemem;
    if (/(^\d+$|^0\.\d+$)/.test(freemem) === false) {
      callback("Option 'freemem' should be a Number.");
    }
  }
  if ('threshold' in options && 'uptime' in options.threshold) {
    var uptime = options.threshold.uptime;
    if (!this.isNumeric(uptime)) {
      callback("Option 'uptime' should be a Number.");
    }
  }
  if ('threshold' in options && 'loadavg' in options.threshold) {
    var loadavg = options.threshold.loadavg;
    if (this.isNumeric(loadavg)) {
      options.threshold.loadavg = [loadavg, loadavg, loadavg];
    } else if (loadavg.constructor === Array) {
      if (
        loadavg.length !== 3 ||
        loadavg.every(function(item, i, arr) {
          if (!this.isNumeric(item)) {
            callback("Option 'loadavg' should be a Number or an Array.");
          }
        }, this)
      ) {
        callback("Option 'loadavg' should contain an Array with 3 items.");
      }
    } else {
      callback("Option 'loadavg' should be a Number or an Array.");
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
