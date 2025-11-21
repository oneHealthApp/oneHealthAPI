import Joi from 'joi';

/**
 * Joi validation schemas for UserRole operations.
 **/
export const UserRoleValidator = {
  // Single Create
  create: Joi.object({
    userId: Joi.string().required().messages({
      'string.empty': 'User ID is required',
      'any.required': 'User ID is required',
    }),
    roleId: Joi.string().required().messages({
      'string.empty': 'Role ID is required',
      'any.required': 'Role ID is required',
    }),
    priority: Joi.number().integer().min(0).max(32767).required().messages({
      'number.base': 'Priority must be a number',
      'number.min': 'Priority must be at least 0',
      'number.max': 'Priority cannot exceed 32767',
    }),
    createdBy: Joi.string().required().messages({
      'string.empty': 'Created by is required',
    }),
  }).options({ abortEarly: false }),

  // Single Update
  update: Joi.object({
    userId: Joi.string().optional().messages({
      'string.empty': 'User ID cannot be empty',
    }),
    roleId: Joi.string().optional().messages({
      'string.empty': 'Role ID cannot be empty',
    }),
    priority: Joi.number().integer().min(0).max(32767).optional().messages({
      'number.base': 'Priority must be a number',
      'number.min': 'Priority must be at least 0',
      'number.max': 'Priority cannot exceed 32767',
    }),
    updatedBy: Joi.string().required().messages({
      'string.empty': 'Updated by is required for updates',
    }),
  }).options({ abortEarly: false }),

  // Bulk Create (Array of Create schemas)
  bulkCreate: Joi.array()
    .items(
      Joi.object({
        userId: Joi.string().required().messages({
          'string.empty': 'User ID is required',
        }),
        roleId: Joi.string().required().messages({
          'string.empty': 'Role ID is required',
        }),
        priority: Joi.number().integer().min(0).max(32767).required().messages({
          'number.base': 'Priority must be a number',
          'number.min': 'Priority must be at least 0',
          'number.max': 'Priority cannot exceed 32767',
        }),
        createdBy: Joi.string().required().messages({
          'string.empty': 'Created by is required',
        }),
      }),
    )
    .min(1)
    .messages({
      'array.min': 'At least one item is required for bulk create',
    }),

  // Bulk Update (Array of Update schemas with IDs)
  bulkUpdate: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required().messages({
          'string.empty': 'ID is required for bulk updates',
        }),
        userId: Joi.string().optional().messages({
          'string.empty': 'User ID cannot be empty',
        }),
        roleId: Joi.string().optional().messages({
          'string.empty': 'Role ID cannot be empty',
        }),
        priority: Joi.number().integer().min(0).max(32767).optional().messages({
          'number.base': 'Priority must be a number',
          'number.min': 'Priority must be at least 0',
          'number.max': 'Priority cannot exceed 32767',
        }),
        updatedBy: Joi.string().required().messages({
          'string.empty': 'Updated by is required for updates',
        }),
      }),
    )
    .min(1)
    .messages({
      'array.min': 'At least one item is required for bulk update',
    }),
};
