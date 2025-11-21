// Description: This module provides a typed access to environment variables.
// It uses dotenv to load environment variables from a .env file and provides default values for some variables.

import dotenv from 'dotenv';

dotenv.config();

/**
 * Provides typed access to all required environment variables.
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3000,
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'default_jwt_secret',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default_jwt_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  // Encryption key
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef',
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
};
