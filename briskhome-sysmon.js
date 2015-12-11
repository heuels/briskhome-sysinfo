/**
 * Briskhome system monitor <briskhome-sysmon.js>
 * Part of Briskhome house monitoring service.
 *
 * @author Egor Zaitsev <ezaitsev@briskhome.com>
 * @version 0.1.2
 */

/*
  Checklist for v0.1.3:
    - Get default values from DEFAULT_CONFIG
    - Allow passing of both array and number to loadavg
    - Settle with _isStopped and _isRunning
*/

/*
  Checklist for v0.2.0:
    v Remove all external dependencies
    - Remove unnecessary variable declarations
*/

'use strict';

/* Internal dependencies */
var events   = require('events'),
    util     = require('util'),
    os       = require('os');

/* Variable declarations - marked for removal prior to v0.2.0 */
var critical = os.cpus().length, // This property is to be removed in v0.1.2
    defaults = {                 // This property is to be removed in v0.1.3
      delay     : 5000,
      critical1 : critical,
      critical5 : critical,
      critical15: '2.0',
      freemem   : 0,
      uptime    : 0,
      silent    : false,
      immediate : false
    };

/*
  Const DEFAULT_CONFIG should be used as a default configuration object.
*/
var DEFAULT_CONFIG = {
  delay     : 5000,   // 5s.
  silent    : false,  // By default Sysmon spams events every cycle.
  immediate : false,  // This option should be renamed.
  critical  : {
    loadavg : os.cpus().length,
    freemem : 0,
    uptime  : 0
  }
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
    config: Object.assign({}, DEFAULT_CONFIG)
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
  var eventObj = Object.assign({timestamp: Math.floor(+Date.now()/1000)}, obj);
  this.emit(event, eventObj);
};

/**
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

  /* Main cycle of the service */
  var main = function() {
    var data = {
          loadavg  : os.loadavg(),
          uptime   : os.uptime(),
          freemem  : os.freemem(),
          totalmem : os.totalmem()
        },
        config = _this.config(),
        freemem = (config.freemem < 1) ? config.freemem * data.totalmem : config.freemem;

    if(!config.silent) {
      _this.sendEvent('monitor', Object.assign({type: 'regular'}, data));
    }
    // TODO: Check if config.loadavg is array.
    if(data.loadavg[0] > config.critical1) {
      _this.sendEvent('loadavg1', Object.assign({type: 'loadavg1'}, data));
    }
    if(data.loadavg[1] > config.critical5) {
      _this.sendEvent('loadavg5', Object.assign({type: 'loadavg5'}, data));
    }
    if(data.loadavg[2] > config.critical15) {
      _this.sendEvent('loadavg15', Object.assign({type: 'loadavg15'}, data));
    }
    if(data.freemem < freemem) {
      _this.sendEvent('freemem', Object.assign({type: 'freemem'}, data));
    }
    if(Number(config.uptime) && data.uptime > Number(config.uptime)) {
      _this.sendEvent('uptime', Object.assign({type: 'uptime'}, data));
    }
  };

  if(_this.config().immediate) {
    process.nextTick(main);
  }
  _this._state.interval = setInterval(main, _this.config().delay);

  if(!_this.isRunning()) {
    _this._state.running = true;
    _this.sendEvent('start', {type: 'start'});
  }

  return _this;
};

/**
 * Stops the Sysmon execution at the beginning of the next loop.
 */
Sysmon.prototype.stop = function() {

  clearInterval(this._state.interval);

  if(this.isRunning()) {
    this._state.running = false;
    this.sendEvent('stop', {type: 'stop'});
  }
  return this;
};

Sysmon.prototype.reset = function() {
  this.sendEvent('reset', {type: 'reset'});
  this[this.isRunning() ? 'start' : 'config'](Object.assign({}, DEFAULT_CONFIG));
  return this;
};

Sysmon.prototype.destroy = function() {

  if(!this._isStopped()) {
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
 * @todo  Need to verify that options array actually is the configuration array.
 *
 * @param {Object} options Configuration object. Naming scheme can be viewed at
 *        the begginning of the file in DEFAULT_CONFIG declaration.
 * @returns {Object} Configuration of the current Sysmon instance.
 */
Sysmon.prototype.config = function(options) {
  /* Type detection is borrowed from Underscore.js */
  var type = typeof options;
  if((type === 'function' || type === 'object' && !!options)) {
    Object.assign(this._state.config, options);
    this.sendEvent('config', {type: 'config', options: Object.assign({}, options)});
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
 * Numeric(-al?) helper methods.
 * The main function checks whether an argument is an acceptable number.
 * Additional functions help quickly convert timestamps to any measure possible.
 *
 * @param {Number} n A number that should be sanitized or converted.
 */

Sysmon.prototype._sanitizeNumber = function(n) {
  if(!isNaN(parseFloat(n)) && isFinite(n)) {
    throw new Error("Number expected");
  }
  if(!n || n < 0) {
    throw new Error("Number must be greater than 0");
  }
  // Math.pow(2, 31)
  if(n >= 2147483648) {
    throw new Error("Number must be smaller than 2147483648");
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


// /**
//  *
//  *
//  *
//  */
//
// module.exports = function(callback) {
//   // var clim = clim("system", console)
//   // var console = clim
//
//   var exec = require('child_process').exec
//   var os = require('os')
//
//   var res = []
//   res['hostname'] = os.hostname()
//   res['arch'] = os.arch()
//
//   // Checking free memory
//   exec('df -k', function(err, stdout, stderr) {
//     if (err) console.error('Unable to execute df -k. Will now quit.')
//
//     var regex = /(\S*)\s+(\d+)\s+(\d+)\s+(\d+)\s+\d+%\s+(\S+)/g
//     var df
//     while ((df = regex.exec(stdout)) !== null) {
//       res['memory'] = {
//         'device': df[1],
//         'available': df[4],
//         'used': df[3],
//         'capacity': df[2],
//         'mount': df[5]
//       }
//     }
//     console.log("%s", res)
//     callback(null, res)
//   })
// }
//
// // var demo = {
// //   'hostname': 'maedhros',
// //   'arch': 'amd64',
// //   'memory': {
// //     [
// //       'device': '/dev/disk1',
// //       'available': '12345',
// //       'used': '12345',
// //       'capacity': '12345',
// //       'mount': '/dev/media'
// //     ],
// //     [
// //       'device': '/dev/disk2',
// //       'available': '12345',
// //       'used': '12345',
// //       'capacity': '12345',
// //       'mount': '/dev/media'
// //     ]
// //   },
// //   'cpu': [
// //     'curload': '1.0',
// //     'avgload': '1.5',
// //     '15mload': '2.0'
// //   ]
// // }
