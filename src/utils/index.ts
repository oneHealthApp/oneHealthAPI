// Project: @app/utils
// Exports For All Utility Functions and Helpers.
// Description: A collection of utility functions and helpers for various tasks in an Express application.

// Cache Helper
export {
  setCache,
  getCache,
  deleteCache,
  flushCache,
  hasCache,
} from './cacheHelper';

// Environment Helper
export { env } from './envHelper';

// Logger
export { default as logger, getModuleLogger } from './logger';

// Pagination
export { PaginationInput } from './pagination';

// Redis Cache Helper
// export { redisCacheHelper } from "./redisCacheHelper";

// Response Helper
export { successResponse, errorResponse } from './responseFormatter';

// Route Logger
export { logRoutes } from './routeLogger';

// Security Helper
export {
  hashPassword,
  comparePassword,
  encrypt,
  decrypt,
} from './securityHelper';

// Shutdown Helper (if needed)
export { shutdownApp } from './shutdownHelper';
