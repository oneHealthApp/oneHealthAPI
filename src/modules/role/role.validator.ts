import Joi from 'joi';

/**
 * Joi validation schema for Role operations.
 **/
export const RoleValidator = {
  // Strict validation for CREATE (all fields required)
  create: Joi.object({
    roleName: Joi.string().required().messages({
      'string.empty': 'Role name is required',
      'any.required': 'Role name is required',
    }),
    roleCategory: Joi.string().optional().allow('').messages({
      'string.base': 'Role category must be a string',
    }),
    priority: Joi.number()
      .integer()
      .strict()
      .min(0)
      .max(32767)
      .required()
      .messages({
        'number.base':
          'Priority must be a number (strict mode: no strings allowed)',
        'number.integer': 'Priority must be an integer',
        'number.min': 'Priority must be at least 0',
        'number.max': 'Priority cannot exceed 32767',
        'any.required': 'Priority is required',
      }),
    createdBy: Joi.string().required().messages({
      'string.empty': 'Created by is required',
      'any.required': 'Created by is required',
    }),
    updatedBy: Joi.string().required().messages({
      'string.empty': 'Updated by is required',
      'any.required': 'Updated by is required',
    }),
  }),

  // Loose validation for UPDATE (only updatedBy required, others optional)
  update: Joi.object({
    roleName: Joi.string().optional().messages({
      'string.empty': 'Role name cannot be empty',
    }),
    roleCategory: Joi.string().optional().allow('').messages({
      'string.base': 'Role category must be a string',
    }),
    priority: Joi.number()
      .integer()
      .strict()
      .min(0)
      .max(32767)
      .optional()
      .messages({
        'number.base':
          'Priority must be a number (strict mode: no strings allowed)',
        'number.integer': 'Priority must be an integer',
        'number.min': 'Priority must be at least 0',
        'number.max': 'Priority cannot exceed 32767',
      }),
    updatedBy: Joi.string().required().messages({
      'string.empty': 'Updated by is required',
      'any.required': 'Updated by is required',
    }),
  }),
};
