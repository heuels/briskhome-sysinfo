/**
 * Briskhome system monitor tests <briskhome-sysmon.test.js>
 * Part of Briskhome house monitoring service.
 *
 * @author Egor Zaitsev <ezaitsev@briskhome.com>
 * @version 0.2.0
 */

'use strict';

var assert = require('chai').assert;
var mock = require('mock-os');

var sysmon = require('./briskhome-sysmon');
var os = require('os');

process.stdout.write(Date());
describe('Sysmon.start()', () => {
  it('should start an instance', () => {
    assert.doesNotThrow(function() {
      sysmon.start();
    });
  });
});

describe('Sysmon.config() ', () => {
  describe('- delay', () => {
    it('should not accept a boolean', function() {
      assert.throws(function() {
        sysmon.start({ delay: false });
      });
    });
    it('should not accept a date', function() {
      assert.throws(function() {
        sysmon.start({ delay: new Date() });
      });
    });
    it('should not accept an array', function() {
      assert.throws(function() {
        sysmon.start({ delay: ['test', 'test'] });
      });
    });
    it('should not accept an object', function() {
      assert.throws(function() {
        sysmon.start({ delay: { test: 'test' } });
      });
    });
    it('should not accept a string', function() {
      assert.throws(function() {
        sysmon.start({ delay: 'test' });
      });
    });
    it('should accept a number', function() {
      assert.doesNotThrow(function() {
        sysmon.start({ delay: 123 });
      });
    });
    it('should accept a number as a string', function() {
      assert.doesNotThrow(function() {
        sysmon.start({ delay: '123' });
      });
    });
  });
  describe('- loop', () => {
    it('should not accept a date', function() {
      assert.throws(function() {
        sysmon.start({ loop: new Date() });
      });
    });
    it('should not accept an array', function() {
      assert.throws(function() {
        sysmon.start({ loop: ['test', 'test'] });
      });
    });
    it('should not accept an object', function() {
      assert.throws(function() {
        sysmon.start({ loop: { test: 'test' } });
      });
    });
    it('should not accept a string', function() {
      assert.throws(function() {
        sysmon.start({ loop: 'test' });
      });
    });
    it('should not accept a number', function() {
      assert.throws(function() {
        sysmon.start({ loop: 123 });
      });
    });
    it('should accept a boolean', function() {
      assert.doesNotThrow(function() {
        sysmon.start({ loop: true });
      });
    });
  });
  describe('- silent', () => {
    it('should not accept a date', function() {
      assert.throws(function() {
        sysmon.start({ silent: new Date() });
      });
    });
    it('should not accept an array', function() {
      assert.throws(function() {
        sysmon.start({ silent: ['test', 'test'] });
      });
    });
    it('should not accept an object', function() {
      assert.throws(function() {
        sysmon.start({ silent: { test: 'test' } });
      });
    });
    it('should not accept a string', function() {
      assert.throws(function() {
        sysmon.start({ silent: 'test' });
      });
    });
    it('should not accept a number', function() {
      assert.throws(function() {
        sysmon.start({ silent: 123 });
      });
    });
    it('should accept a boolean', function() {
      assert.doesNotThrow(function() {
        sysmon.start({ silent: true });
      });
    });
  });
  describe('- threshold', () => {
    it('should not accept a boolean', function() {
      assert.throws(function() {
        sysmon.start({ threshold: true });
      });
    });
    it('should not accept a date', function() {
      assert.throws(function() {
        sysmon.start({ threshold: new Date() });
      });
    });
    it('should not accept a string', function() {
      assert.throws(function() {
        sysmon.start({ threshold: 'test' });
      });
    });
    it('should accept a number', function() {
      assert.throws(function() {
        sysmon.start({ threshold: 123456789 });
      });
    });
    it('should not accept an array', function() {
      assert.throws(function() {
        sysmon.start({ threshold: ['test'] });
      });
    });
    it('should accept an object', function() {
      assert.doesNotThrow(function() {
        sysmon.start({ threshold: { test: 'test' } });
      });
    });
  });
  describe('- threshold.freemem', () => {
    it('should not accept a boolean', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { freemem: true } });
      });
    });
    it('should not accept a date', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { freemem: new Date() } });
      });
    });
    it('should not accept an array', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { freemem: ['test'] } });
      });
    });
    it('should not accept an object', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { freemem: { test: 'test' } } });
      });
    });
    it('should not accept a string', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { freemem: 'test' } });
      });
    });
    it('should accept a number', function() {
      assert.doesNotThrow(function() {
        sysmon.start({ threshold: { freemem: 123456789 } });
      });
    });
    it('should accept a number as a string', function() {
      assert.doesNotThrow(function() {
        sysmon.start({ threshold: { freemem: '123456789' } });
      });
    });
  });
  describe('- threshold.uptime', () => {
    it('should not accept a boolean', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { uptime: true } });
      });
    });
    it('should not accept a date', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { uptime: new Date() } });
      });
    });
    it('should not accept an array', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { uptime: ['test'] } });
      });
    });
    it('should not accept an object', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { uptime: { test: 'test' } } });
      });
    });
    it('should not accept a string', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { uptime: 'test' } });
      });
    });
    it('should accept a number', function() {
      assert.doesNotThrow(function() {
        sysmon.start({ threshold: { uptime: 123456789 } });
      });
    });
    it('should accept a number as a string', function() {
      assert.doesNotThrow(function() {
        sysmon.start({ threshold: { uptime: '123456789' } });
      });
    });
  });
  describe('- threshold.loadavg', () => {
    it('should not accept a boolean', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { loadavg: true } });
      });
    });
    it('should not accept a date', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { loadavg: new Date() } });
      });
    });
    it('should not accept an object', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { loadavg: { test: 'test' } } });
      });
    });
    it('should not accept a string', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { loadavg: 'test' } });
      });
    });
    it('should accept a number', function() {
      assert.doesNotThrow(function() {
        sysmon.start({ threshold: { loadavg: 123456789 } });
      });
    });
    it('should accept a number as a string', function() {
      assert.doesNotThrow(function() {
        sysmon.start({ threshold: { loadavg: '123456789' } });
      });
    });
    it('should not accept an array if it does not contain strings', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { loadavg: ['test', 'test'] } });
      });
    });
    it('should not accept an array if it does not contain strings', function() {
      assert.throws(function() {
        sysmon.start({ threshold: { loadavg: ['test', 'test', 'test'] } });
      });
    });
    it('should accept an array with 3 numbers', function() {
      assert.doesNotThrow(function() {
        sysmon.start({ threshold: { loadavg: [1234, 1234, 1234] } });
      });
    });
    it('should accept an array with 3 numbers as strings', function() {
      assert.doesNotThrow(function() {
        sysmon.start({ threshold: { loadavg: ['1234', '1234', '1234'] } });
      });
    });
  });
  describe('Miscellaneous tests:', () => {
    it('Issue #1: should save default configuration', function() {
      assert.doesNotThrow(function() {
        sysmon.start();
        var uptime = sysmon.config().threshold.uptime;
        sysmon.start({
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
