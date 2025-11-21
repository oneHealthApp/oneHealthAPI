// logger.ts
import { config, createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';

const validLogLevels = [
  'error',
  'warn',
  'info',
  'http',
  'verbose',
  'debug',
  'silly',
];
const LOG_LEVEL = validLogLevels.includes(process.env.LOG_LEVEL || '')
  ? process.env.LOG_LEVEL
  : 'debug';
const LOG_FILE_MAX_SIZE = /^\d+[kKmMgG]$/.test(
  process.env.LOG_FILE_MAX_SIZE || '',
)
  ? process.env.LOG_FILE_MAX_SIZE
  : '1m';
const LOG_FILE_RETENTION = /^\d+[dDwWmM]$/.test(
  process.env.LOG_FILE_RETENTION || '',
)
  ? process.env.LOG_FILE_RETENTION
  : '7d';

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json(),
);

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = createLogger({
  levels: { ...config.npm.levels, http: 0 },
  level: LOG_LEVEL,
  exitOnError: false,
  format: logFormat,
  defaultMeta: {
    service: 'sample-microservice',
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console transport for development
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),

    // Daily rotating file transport for application logs
    new transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: LOG_FILE_MAX_SIZE,
      maxFiles: LOG_FILE_RETENTION,
      level: LOG_LEVEL,
    }),

    // Daily rotating file transport for error logs
    new transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: LOG_FILE_MAX_SIZE,
      maxFiles: LOG_FILE_RETENTION,
      level: 'error',
    }),
  ],

  exceptionHandlers: [
    // Handle uncaught exceptions
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: LOG_FILE_MAX_SIZE,
      maxFiles: LOG_FILE_RETENTION,
    }),
  ],

  rejectionHandlers: [
    // Handle unhandled promise rejections
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.DailyRotateFile({
      filename: 'logs/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: LOG_FILE_MAX_SIZE,
      maxFiles: LOG_FILE_RETENTION,
    }),
  ],
});

// Function to create module-specific loggers
export const getModuleLogger = (moduleName: string) => {
  return logger.child({ module: moduleName });
};

export default logger;
