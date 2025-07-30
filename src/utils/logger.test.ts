import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { logger } from './logger.js';

describe('Logger', () => {
  let originalConsole: any;

  beforeEach(() => {
    // Save original console methods
    originalConsole = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };

    // Reset logger to default state
    logger.setLogLevel('info');
  });

  afterEach(() => {
    // Restore original console methods
    Object.assign(console, originalConsole);
  });

  describe('log levels', () => {
    it('should log info, warn, and error at info level', () => {
      let debugCalled = false;
      let infoCalled = false;
      let warnCalled = false;
      let errorCalled = false;

      console.debug = () => { debugCalled = true; };
      console.info = () => { infoCalled = true; };
      console.warn = () => { warnCalled = true; };
      console.error = () => { errorCalled = true; };

      logger.setLogLevel('info');
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      assert.strictEqual(debugCalled, false);
      assert.strictEqual(infoCalled, true);
      assert.strictEqual(warnCalled, true);
      assert.strictEqual(errorCalled, true);
    });

    it('should log all levels at debug level', () => {
      let debugCalled = false;
      let infoCalled = false;
      let warnCalled = false;
      let errorCalled = false;

      console.debug = () => { debugCalled = true; };
      console.info = () => { infoCalled = true; };
      console.warn = () => { warnCalled = true; };
      console.error = () => { errorCalled = true; };

      logger.setLogLevel('debug');
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      assert.strictEqual(debugCalled, true);
      assert.strictEqual(infoCalled, true);
      assert.strictEqual(warnCalled, true);
      assert.strictEqual(errorCalled, true);
    });

    it('should only log error at error level', () => {
      let debugCalled = false;
      let infoCalled = false;
      let warnCalled = false;
      let errorCalled = false;

      console.debug = () => { debugCalled = true; };
      console.info = () => { infoCalled = true; };
      console.warn = () => { warnCalled = true; };
      console.error = () => { errorCalled = true; };

      logger.setLogLevel('error');
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      assert.strictEqual(debugCalled, false);
      assert.strictEqual(infoCalled, false);
      assert.strictEqual(warnCalled, false);
      assert.strictEqual(errorCalled, true);
    });
  });

  describe('getLogLevel and setLogLevel', () => {
    it('should return current log level', () => {
      logger.setLogLevel('debug');
      assert.strictEqual(logger.getLogLevel(), 'debug');
      
      logger.setLogLevel('warn');
      assert.strictEqual(logger.getLogLevel(), 'warn');
    });
  });
});