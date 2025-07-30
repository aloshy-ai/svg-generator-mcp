import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { logger } from './logger.js';

describe('Logger', () => {
  let consoleSpies: {
    debug: any;
    info: any;
    warn: any;
    error: any;
  };

  beforeEach(() => {
    // Spy on console methods
    consoleSpies = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
    
    // Reset logger to default state
    logger.setLogLevel('info');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('log levels', () => {
    it('should log info, warn, and error at info level', () => {
      logger.setLogLevel('info');
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(consoleSpies.debug).not.toHaveBeenCalled();
      expect(consoleSpies.info).toHaveBeenCalledOnce();
      expect(consoleSpies.warn).toHaveBeenCalledOnce();
      expect(consoleSpies.error).toHaveBeenCalledOnce();
    });

    it('should log all levels at debug level', () => {
      logger.setLogLevel('debug');
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(consoleSpies.debug).toHaveBeenCalledOnce();
      expect(consoleSpies.info).toHaveBeenCalledOnce();
      expect(consoleSpies.warn).toHaveBeenCalledOnce();
      expect(consoleSpies.error).toHaveBeenCalledOnce();
    });

    it('should only log error at error level', () => {
      logger.setLogLevel('error');
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(consoleSpies.debug).not.toHaveBeenCalled();
      expect(consoleSpies.info).not.toHaveBeenCalled();
      expect(consoleSpies.warn).not.toHaveBeenCalled();
      expect(consoleSpies.error).toHaveBeenCalledOnce();
    });
  });

  describe('message formatting', () => {
    it('should format messages with timestamp and level', () => {
      logger.info('test message');
      
      const call = consoleSpies.info.mock.calls[0][0];
      
      // Should contain timestamp (ISO format)
      expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      
      // Should contain level
      expect(call).toContain('INFO ');
      
      // Should contain message
      expect(call).toContain('test message');
    });

    it('should format additional arguments', () => {
      const testObject = { key: 'value' };
      const testNumber = 42;
      
      logger.info('test message', testObject, testNumber);
      
      const call = consoleSpies.info.mock.calls[0][0];
      
      expect(call).toContain('test message');
      expect(call).toContain(JSON.stringify(testObject, null, 2));
      expect(call).toContain('42');
    });

    it('should handle string conversion of non-object arguments', () => {
      logger.info('test message', 123, true, null, undefined);
      
      const call = consoleSpies.info.mock.calls[0][0];
      
      expect(call).toContain('test message');
      expect(call).toContain('123');
      expect(call).toContain('true');
      expect(call).toContain('null');
      expect(call).toContain('undefined');
    });
  });

  describe('getLogLevel and setLogLevel', () => {
    it('should return current log level', () => {
      logger.setLogLevel('debug');
      expect(logger.getLogLevel()).toBe('debug');
      
      logger.setLogLevel('warn');
      expect(logger.getLogLevel()).toBe('warn');
    });

    it('should update log level', () => {
      logger.setLogLevel('warn');
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      
      expect(consoleSpies.debug).not.toHaveBeenCalled();
      expect(consoleSpies.info).not.toHaveBeenCalled();
      expect(consoleSpies.warn).toHaveBeenCalledOnce();
    });
  });

  describe('level padding', () => {
    it('should pad levels to consistent width', () => {
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
      
      // Set to debug level to capture all messages
      logger.setLogLevel('debug');
      
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
      
      const debugCall = consoleSpies.debug.mock.calls[0][0];
      const infoCall = consoleSpies.info.mock.calls[0][0]; 
      const warnCall = consoleSpies.warn.mock.calls[0][0];
      const errorCall = consoleSpies.error.mock.calls[0][0];
      
      // All levels should be padded to 5 characters
      expect(debugCall).toContain('DEBUG ');
      expect(infoCall).toContain('INFO  ');
      expect(warnCall).toContain('WARN  ');
      expect(errorCall).toContain('ERROR ');
    });
  });
});