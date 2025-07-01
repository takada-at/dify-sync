export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

let logLevel: LogLevel;

function parseLogLevel(level: string): LogLevel {
  switch (level) {
    case 'error':
      return LogLevel.ERROR;
    case 'warn':
      return LogLevel.WARN;
    case 'info':
      return LogLevel.INFO;
    case 'debug':
      return LogLevel.DEBUG;
    default:
      return LogLevel.INFO;
  }
}

function initLogger(): void {
  const level = globalThis.process.env.LOG_LEVEL?.toLowerCase() || 'info';
  logLevel = parseLogLevel(level);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function log(level: LogLevel, message: string, ...args: any[]): void {
  if (level <= logLevel) {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    globalThis.console.log(`[${timestamp}] ${levelName}: ${message}`, ...args);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function error(message: string, ...args: any[]): void {
  log(LogLevel.ERROR, message, ...args);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function warn(message: string, ...args: any[]): void {
  log(LogLevel.WARN, message, ...args);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function info(message: string, ...args: any[]): void {
  log(LogLevel.INFO, message, ...args);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debug(message: string, ...args: any[]): void {
  log(LogLevel.DEBUG, message, ...args);
}

// Initialize logger
initLogger();
