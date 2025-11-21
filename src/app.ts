import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorResponse, logger, shutdownApp } from './utils';
import { Request, Response, NextFunction } from 'express';
import { requestLogger } from './middlewares';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { swaggerSpec, swaggerUi, swaggerUiOptions } from './config/swagger';
import {
  menuRoutes,
  roleMenuAccessRoutes,
  roleRoutes,
  userRoutes,
  UserRoleRoutes,
  authRouter,
  patientRoutes,
  clinicRoutes,
  doctorRoutes,
} from './modules';
import setupRoutes from './routes/setup.routes';

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Morgan stream to pass logs to Winston
const stream = {
  write: (message: string) => logger.http(message.trim()),
};

app.use(limiter);

// Morgan middleware for HTTP logging
app.use(
  morgan('combined', {
    stream,
    skip: (req, res) =>
      process.env.NODE_ENV === 'production' && res.statusCode < 400,
  }),
);

app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
// app.use(compression());
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).requestId = uuidv4();
  next();
});
app.use(requestLogger);
// app.use(jwtMiddleware);

// Swagger Documentation
const swaggerPath = process.env.SWAGGER_PATH || '/api-docs';
const swaggerJsonPath = process.env.SWAGGER_JSON_PATH || '/api-docs.json';

// Serve Swagger JSON
app.get(swaggerJsonPath, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve Swagger UI
app.use(swaggerPath, swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'OneHealth API',
    version: '1.0.0'
  });
});

app.use(
  '/api/v1',
  authRouter,
  userRoutes,
  menuRoutes,
  roleRoutes,
  roleMenuAccessRoutes,
  UserRoleRoutes,
  patientRoutes,
  clinicRoutes,
  doctorRoutes,
);

// Setup routes (for development/testing only)
app.use('/setup', setupRoutes);

// Default error handler
app.use((err: any, req: Request, res: Response, _next: NextFunction): void => {
  const statusCode = err.status || 500;
  const message =
    process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error';

  const log = {
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
    headers: req.headers,
    query: req.query,
    requestId: (req as any).requestId || null,
    userId: (req as any).user?.id || 'anonymous',
  };

  // Log the error
  logger.error('Unhandled error: %o', log);

  // Send error response
  errorResponse(res, message, statusCode);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at: %o, reason: %o', promise, reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error: Error) => {
  logger.error('Uncaught Exception: %o', error);
  await shutdownApp();
  process.exit(1);
});

export default app;
