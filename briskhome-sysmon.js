/**
 * Briskhome system monitor <briskhome-sysmon.js>
 * Part of Briskhome house monitoring service.
 *
 * @author Egor Zaitsev <ezaitsev@briskhome.com>
 * @version 0.1.3
 */

'use strict';

var events   = require('events');
var util     = require('util');
var os       = require('os');

var DEFAULT_CONFIG = {
  loop: false,
  delay: 5000,
  silent: false,
  threshold: {
    loadavg: os.cpus().length,
    freemem: 0,
    uptime: 0,
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
  var eventObj = Object.assign({timestamp: curtime}, obj);
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
    _this.config(options);
  }
  var main = function() {
    var data = {
      loadavg: os.loadavg(),
      uptime: os.uptime(),
      freemem: os.freemem(),
      totalmem: os.totalmem(),
    };
    var config = _this.config();
    var freemem = (config.threshold.freemem < 1)
      ? config.threshold.freemem * data.totalmem
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
  _this._state.interval = setInterval(main, _this.config().delay);
  if (!_this.isRunning()) {
    _this._state.running = true;
    _this.sendEvent('start', {type: 'start'});
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
    this.sendEvent('stop', {type: 'stop'});
  }
  return this;
};

/**
 * Restarts and reconfigures Sysmon instance.
 */
Sysmon.prototype.reset = function() {
  this.sendEvent('reset', {type: 'reset'});
  this[this.isRunning() ? 'start' : 'config']
    (Object.assign({}, DEFAULT_CONFIG));
  return this;
};

/**
 * Destroys Sysmon instance and emits a 'destroy' event.
 */
Sysmon.prototype.destroy = function() {
  if (!this._isStopped()) {
    this.sendEvent('destroy', {type: 'destroy'});
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
 * @todo  Need to throw an error if options object has wrong content.
 *
 * @param {Object} options Configuration object. Naming scheme can be viewed at
 *        the begginning of the file in DEFAULT_CONFIG declaration.
 * @returns {Object} Configuration of the current Sysmon instance.
 */
Sysmon.prototype.config = function(options) {
  var optType = typeof options;
  var argType = typeof options.threshold.loadavg;
  if ((optType === 'function' || optType === 'object' && !!options)) {
    if (argType === 'string' || argType instanceof String) {
      console.log(options.threshold.loadavg);
      var loadavg = options.threshold.loadavg;
      options.threshold.loadavg = [loadavg, loadavg, loadavg];
      console.log(options.threshold.loadavg);
    }
    Object.assign(this._state.config, options);
    this.sendEvent('config', {
      type: 'config',
      options: Object.assign({}, options),
    });
  }
  return this._state.config;
};

Sysmon.prototype.isRunning = function() {
  return !!this._state.running;
};

/**
 * Checks whether Sysmon is running.
 *
 * @returns {Boolean} status True = running, false = stopped.
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
Sysmon.prototype._sanitizeNumber = function(n) {
  if (!isNaN(parseFloat(n)) && isFinite(n)) {
    throw new Error('Number expected');
  }
  if (!n || n < 0) {
    throw new Error('Number must be greater than 0');
  }
  // Math.pow(2, 31)
  if (n >= 2147483648) {
    throw new Error('Number must be smaller than 2147483648');
  }
  return n;
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
