type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private logLevel: LogLevel = 'info';

  constructor() {
    // Set log level from environment variable
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    if (envLogLevel && ['debug', 'info', 'warn', 'error'].includes(envLogLevel)) {
      this.logLevel = envLogLevel;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] ${levelStr} ${message}${formattedArgs}`;
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, ...args));
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, ...args));
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, ...args));
    }
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, ...args));
    }
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  getLogLevel(): LogLevel {
    return this.logLevel;
  }
}

export const logger = new Logger();