import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { errorResponse, logger } from '../utils';

/**
 * Middleware to validate request params and query against a Joi schema.
 */
export const validateParamsAndQuery =
  (schema: Schema) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Combine params and query for validation
    const dataToValidate = {
      ...req.params,
      ...req.query
    };

    const { error } = schema.validate(dataToValidate, { abortEarly: false });

    if (error) {
      const errorDetails: Record<string, string> = {};
      
      error.details.forEach((err) => {
        const key = err.context?.key || 'unknown';
        if (!errorDetails[key]) {
          errorDetails[key] = err.message;
        }
      });

      logger.warn('Validation failed', {
        requestId: (req as any).requestId || null,
        userId: (req as any).user?.id || 'anonymous',
        errors: errorDetails,
      });

      errorResponse(res, errorDetails, 400, 'Validation Failed');
      return;
    }

    next();
  };