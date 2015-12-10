/**
 * Briskhome system monitor <briskhome-sysmon.js>
 * Part of Briskhome house monitoring service.
 *
 * @author Egor Zaitsev <ezaitsev@briskhome.com>
 * @version 0.1.1
 */

/*
  TODO: Critical values should be declared as a const for now.
*/
var util     = require('util'),
    os       = require('os'),
    _        = require('underscore'),
    events   = require('events')
    critical = os.cpus().length, // This property is to be removed in v0.1.2
    defaults = {
      delay     : 3000,
      critical1 : critical,
      critical5 : critical,
      critical15: critical,
      freemem   : 0, // SHOULD be either MB or per cent
      uptime    : 0,
      silent    : false,
      immediate : false
    }

/*
  TODO: Use this const as a default configuration object.
  In v0.1.0 passing in the configuration to the start() is not planned.
*/
const DEFAULT_CONFIG = {
  delay : 3000,
  critical1 : critical,
  critical5 : critical,
  critical15: critical,
  freemem   : 0, // SHOULD be either MB or per cent
  uptime    : 0,
  silent    : false,
  stream    : false, //DEPRECATED
  immediate : false
}

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
    EventEmitter object, which executes the constructor method of
    EventEmitter.
  */
  events.EventEmitter.call(this);
  this._state = {
    running: false,
    ended: false,
    interval: undefined,
    config: _.clone(defaults) // TODO: clone from underscore
  }
}
/**
 * Copies all of the EventEmitter properties to the Sysmon object.
 */
Sysmon.prototype.__proto__ = events.EventEmitter.prototype;

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
  var eventObj = (JSON.parse(JSON.stringify(obj)))
  eventObj.timestamp = Math.floor(_.now() / 1000)
  this.emit(event, eventObj)
}

/**
 * Main function of the library. Checks the server stats and emits events when
 * necessary. Amount of output can be tuned with the truthy 'silent' parameter
 * in the options array.
 *
 * @param {Array} options A set of options passed from the declaration.
 * @returns {Sysmon}
 */
Sysmon.prototype.start = function(options) {
  var self = this
  if (this._isEnded()) {
    throw new Error("monitor has been ended by .destroy() method")
  }

  //TODO: WHAT DOES IT DO?!
  self.stop()
    .config(options)

  /* Main cycle of the service */
  var cycle = function() {
    var info = {
      loadavg  : os.loadavg(),
      uptime   : os.uptime(),
      freemem  : os.freemem(),
      totalmem : os.totalmem()
    },
    config = self.config(),
    freemem  = (config.freemem < 1) ? config.freemem * info.totalmem : config.freemem

    if(!config.silent) {
      self.sendEvent('monitor', _.extend({type: 'monitor'}, info))
    }
    // TODO: Check if config.loadavg is array.
    if(info.loadavg[0] > config.critical1) {
      self.sendEvent('loadavg1', _.extend({type: 'loadavg1'}, info))
    }
    if(info.loadavg[1] > config.critical5) {
      self.sendEvent('loadavg5', _.extend({type: 'loadavg5'}, info))
    }
    if(info.loadavg[2] > config.critical15) {
      self.sendEvent('loadavg15', _.extend({type: 'loadavg15'}, info))
    }
    if(info.freemem < freemem) {
      self.sendEvent('freemem', _.extend({type: 'freemem'}, info))
    }
    if(Number(config.uptime) && info.uptime > Number(config.uptime)) {
      self.sendEvent('uptime', _.extend({type: 'uptime'}, info))
    }
  }

  if(self.config().immediate) {
    process.nextTick(cycle)
  }
  self._state.interval = setInterval(cycle, self.config().delay)

  if(!self.isRunning()) {
    self._state.running = true
    self.sendEvent('start', {type: 'start'})
  }

  return self
}

/**
 * Stops the Sysmon execution at the beginning of the next loop.
 */
Sysmon.prototype.stop = function() {

  clearInterval(this._state.interval)

  if(this.isRunning()) {
    this._state.running = false
    this.sendEvent('stop', {type: 'stop'})
  }
  return this
}

Sysmon.prototype.reset = function() {
  this.sendEvent('reset', {type: 'reset'})
  this[this.isRunning() ? 'start' : 'config'](_.clone(defaults))
  return this
}

Sysmon.prototype.destroy = function() {

  if(!this._isEnded()) {
    this.sendEvent('destroy', {type: 'destroy'})
    this.stop()
    if(this instanceof stream.Readable) {
      this.emit('close')
      this.push(null)
    }
    this._state.ended = true
  }

  return this
}

Sysmon.prototype.config = function(options) {

  if(_.isObject(options)) {
    _.extend(this._state.config, options)
    this.sendEvent('config', {
                               type: 'config',
                               options: _.clone(options)
                             })
  }

  return this._state.config
}

Sysmon.prototype.isRunning = function() {
  return !!this._state.running
}

/**
 * Checks whether Sysmon is running.
 *
 * @returns {Boolean} status True = running, false = stopped.
 * @private
 */
Sysmon.prototype._isEnded = function() {
  return !!this._state.ended
}

/**
 * Numeric(-al?) helper methods.
 * The main function checks whether an argument is an acceptable number.
 * Additional functions help quickly convert timestamps to any measure possible.
 *
 * @param {Number} n A number that should be sanitized or converted.
 */

Sysmon.prototype._sanitizeNumber = function(n) {
  if(!_.isNumber(n)) {
    throw new Error("Number expected")
  }
  if(!n || n < 0) {
    throw new Error("Number must be greater than 0")
  }
  // Math.pow(2, 31)
  if(n >= 2147483648) {
    throw new Error("Number must be smaller than 2147483648")
  }
  return n
}

/* TODO: The following functions should be rewritten as private */
// Sysmon.prototype.seconds = function(n) {
//   return this._sanitizeNumber(n * 1000)
// }
//
// Sysmon.prototype.minutes = function(n) {
//   return this._sanitizeNumber(n * this.seconds(60))
// }
//
// Sysmon.prototype.hours = function(n) {
//   return this._sanitizeNumber(n * this.minutes(60))
// }
//
// Sysmon.prototype.days = function(n) {
//   return this._sanitizeNumber(n * this.hours(24))
// }

/**
 * Several functions extracted from Underscore.js
 */
// Sysmon.prototype.isArray = nativeIsArray || function(obj) {
//   return toString.call(obj) === '[object Array]'
// }
// Sysmon.prototype.isObject = function(o) {
//   var type = typeof obj
//   return type === 'function' || type === 'object' && !!obj
// }
// Sysmon.prototype.clone = function(obj) {
//   var type = typeof obj
//   if (!_.isObject(obj)) return obj;
//   return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
// }
// Sysmon.prototype.clone = function(arr) {
//   // body...
// }

// I don't think it is needed for me.
Sysmon.prototype.os = os

module.exports = new Sysmon()
module.exports.Sysmon = Sysmon


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
