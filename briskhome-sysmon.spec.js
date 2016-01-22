/**
 * Briskhome system monitor tests <briskhome-sysmon.spec.js>
 * Part of Briskhome house monitoring service.
 *
 * @author Egor Zaitsev <ezaitsev@briskhome.com>
 * @version 0.3.0
 */

'use strict';

/* globals it: false */
/* globals describe: false */

var assert = require('chai').assert;

var sysmon = require('./briskhome-sysmon');

process.stdout.write(Date());

describe('._start()', () => {
  it('should _start an instance', () => {
    assert.doesNotThrow(function() {
      sysmon._start();
    });
  });


  describe('main', function() {

  });

  describe('review', function() {
    it('should throw critical \'freemem\'', function() {
      sysmon._start();

    });
  });
});

describe('.config() ', () => {
  describe('- interval', () => {
    it('should not accept a boolean', function() {
      assert.throws(function() {
        sysmon._start({ interval: false, });
      });
    });
    it('should not accept a date', function() {
      assert.throws(function() {
        sysmon._start({ interval: new Date(), });
      });
    });
    it('should not accept an array', function() {
      assert.throws(function() {
        sysmon._start({ interval: ['test', 'test'], });
      });
    });
    it('should not accept an object', function() {
      assert.throws(function() {
        sysmon._start({ interval: {test: 'test'}, });
      });
    });
    it('should not accept a string', function() {
      assert.throws(function() {
        sysmon._start({ interval: 'test', });
      });
    });
    it('should accept a number', function() {
      assert.doesNotThrow(function() {
        sysmon._start({ interval: 123, });
      });
    });
    it('should accept a number as a string', function() {
      assert.doesNotThrow(function() {
        sysmon._start({ interval: '123', });
      });
    });
  });
  describe('- loop', () => {
    it('should not accept a date', function() {
      assert.throws(function() {
        sysmon._start({ loop: new Date(), });
      });
    });
    it('should not accept an array', function() {
      assert.throws(function() {
        sysmon._start({ loop: ['test', 'test'], });
      });
    });
    it('should not accept an object', function() {
      assert.throws(function() {
        sysmon._start({ loop: {test: 'test'}, });
      });
    });
    it('should not accept a string', function() {
      assert.throws(function() {
        sysmon._start({ loop: 'test', });
      });
    });
    it('should not accept a number', function() {
      assert.throws(function() {
        sysmon._start({ loop: 123, });
      });
    });
    it('should accept a boolean', function() {
      assert.doesNotThrow(function() {
        sysmon._start({ loop: true, });
      });
    });
  });
  describe('- silent', () => {
    it('should not accept a date', function() {
      assert.throws(function() {
        sysmon._start({ silent: new Date(), });
      });
    });
    it('should not accept an array', function() {
      assert.throws(function() {
        sysmon._start({ silent: ['test', 'test'], });
      });
    });
    it('should not accept an object', function() {
      assert.throws(function() {
        sysmon._start({ silent: {test: 'test'}, });
      });
    });
    it('should not accept a string', function() {
      assert.throws(function() {
        sysmon._start({ silent: 'test', });
      });
    });
    it('should not accept a number', function() {
      assert.throws(function() {
        sysmon._start({ silent: 123, });
      });
    });
    it('should accept a boolean', function() {
      assert.doesNotThrow(function() {
        sysmon._start({ silent: true, });
      });
    });
  });
  describe('- threshold', () => {
    it('should not accept a boolean', function() {
      assert.throws(function() {
        sysmon._start({ threshold: true, });
      });
    });
    it('should not accept a date', function() {
      assert.throws(function() {
        sysmon._start({ threshold: new Date(), });
      });
    });
    it('should not accept a string', function() {
      assert.throws(function() {
        sysmon._start({ threshold: 'test', });
      });
    });
    it('should accept a number', function() {
      assert.throws(function() {
        sysmon._start({ threshold: 123456789, });
      });
    });
    it('should not accept an array', function() {
      assert.throws(function() {
        sysmon._start({ threshold: ['test'], });
      });
    });
    it('should accept an object', function() {
      assert.doesNotThrow(function() {
        sysmon._start({ threshold: {test: 'test', }, });
      });
    });
  });
  describe('- threshold.freemem', () => {
    it('should not accept a boolean', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { freemem: true, }, });
      });
    });
    it('should not accept a date', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { freemem: new Date(), }, });
      });
    });
    it('should not accept an array', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { freemem: ['test'], }, });
      });
    });
    it('should not accept an object', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { freemem: {test: 'test', }, }, });
      });
    });
    it('should not accept a string', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { freemem: 'test', }, });
      });
    });
    it('should accept a number', function() {
      assert.doesNotThrow(function() {
        sysmon._start({ threshold: { freemem: 123456789, }, });
      });
    });
    it('should accept a number as a string', function() {
      assert.doesNotThrow(function() {
        sysmon._start({ threshold: { freemem: '123456789', }, });
      });
    });
  });
  describe('- threshold.uptime', () => {
    it('should not accept a boolean', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { uptime: true, }, });
      });
    });
    it('should not accept a date', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { uptime: new Date(), }, });
      });
    });
    it('should not accept an array', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { uptime: ['test'], }, });
      });
    });
    it('should not accept an object', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { uptime: {test: 'test', }, }, });
      });
    });
    it('should not accept a string', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { uptime: 'test', }, });
      });
    });
    it('should accept a number', function() {
      assert.doesNotThrow(function() {
        sysmon._start({ threshold: { uptime: 123456789, }, });
      });
    });
    it('should accept a number as a string', function() {
      assert.doesNotThrow(function() {
        sysmon._start({ threshold: { uptime: '123456789', }, });
      });
    });
  });
  describe('- threshold.loadavg', () => {
    it('should not accept a boolean', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { loadavg: true, }, });
      });
    });
    it('should not accept a date', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { loadavg: new Date(), }, });
      });
    });
    it('should not accept an object', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { loadavg: {test: 'test', }, }, });
      });
    });
    it('should not accept a string', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { loadavg: 'test', }, });
      });
    });
    it('should accept a number', function() {
      assert.doesNotThrow(function() {
        sysmon._start({ threshold: { loadavg: 123456789, }, });
      });
    });
    it('should accept a number as a string', function() {
      assert.doesNotThrow(function() {
        sysmon._start({ threshold: { loadavg: '123456789', }, });
      });
    });
    it('should not accept an array if it does not contain strings', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { loadavg: ['test', 'test'], }, });
      });
    });
    it('should not accept an array if it does not contain strings', function() {
      assert.throws(function() {
        sysmon._start({ threshold: { loadavg: ['test', 'test', 'test'], }, });
      });
    });
    it('should accept an array with 3 numbers', function() {
      assert.doesNotThrow(function() {
        sysmon._start({ threshold: { loadavg: [1234, 1234, 1234], }, });
      });
    });
    it('should accept an array with 3 numbers as strings', function() {
      assert.doesNotThrow(function() {
        sysmon._start({ threshold: { loadavg: ['1234', '1234', '1234'], }, });
      });
    });
  });
  describe('Miscellaneous tests:', () => {
    it('Issue #1: should save default configuration', function() {
      assert.doesNotThrow(function() {
        sysmon._start();
        var uptime = sysmon.config().threshold.uptime;
        sysmon._start({
          threshold: {
            test: 'test',
          },
        });
        sysmon.on('config', function(event) {
          if (event.threshold.uptime !== uptime) {
            throw new Error('Does not save default state!');
          }
        });
      });
    });
  });
});

describe('Sysmon.ps()', () => {
  describe('options', () => {
    it('should not accept random sort parameters', function() {
      assert.throws(function() {
        sysmon.ps({sort: 'test'});
      });
    });
  });
});
