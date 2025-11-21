import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { errorResponse, logger } from '../utils';

/**
 * Middleware to validate request body against a Joi schema.
 */
export const validateRequest =
  (schema: Schema) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorDetails: Record<string, string> = {};
      const sanitizedErrors = Object.fromEntries(
        Object.entries(errorDetails).map(([key, value]) => [
          key,
          key === 'password' ? '***' : value,
        ]),
      );
      error.details.forEach((err) => {
        const key = err.context?.key || 'unknown';
        if (!errorDetails[key]) {
          errorDetails[key] = err.message;
        }
      });

      logger.warn('Validation failed', {
        requestId: (req as any).requestId || null,
        userId: (req as any).user?.id || 'anonymous',
        errors: sanitizedErrors,
      });

      errorResponse(res, errorDetails, 400, 'Validation Failed');
      return;
    }

    next();
  };
