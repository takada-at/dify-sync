export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

let logLevel: LogLevel;

function parseLogLevel(level: string): LogLevel {
  switch (level) {
    case 'error': return LogLevel.ERROR;
    case 'warn': return LogLevel.WARN;
    case 'info': return LogLevel.INFO;
    case 'debug': return LogLevel.DEBUG;
    default: return LogLevel.INFO;
  }
}

function initLogger(): void {
  const level = process.env.LOG_LEVEL?.toLowerCase() || 'info';
  logLevel = parseLogLevel(level);
}

function log(level: LogLevel, message: string, ...args: any[]): void {
  if (level <= logLevel) {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    console.log(`[${timestamp}] ${levelName}: ${message}`, ...args);
  }
}

export function error(message: string, ...args: any[]): void {
  log(LogLevel.ERROR, message, ...args);
}

export function warn(message: string, ...args: any[]): void {
  log(LogLevel.WARN, message, ...args);
}

export function info(message: string, ...args: any[]): void {
  log(LogLevel.INFO, message, ...args);
}

export function debug(message: string, ...args: any[]): void {
  log(LogLevel.DEBUG, message, ...args);
}

// Initialize logger
initLogger();