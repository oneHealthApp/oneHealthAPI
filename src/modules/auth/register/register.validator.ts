import Joi from 'joi';

/**
 * Joi validation schema for Register create/update operations.
  **/
export const RegisterValidator = {
  createOrUpdate: Joi.object({
    username: Joi.string().min(3).max(50).required().messages({
      'string.base': 'Username must be a string',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 50 characters',
      'any.required': 'Username is required'
    }),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
      'string.base': 'Password must be a string',
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
    emailId: Joi.string().email().optional().messages({
      'string.email': 'Please provide a valid email address'
    }),
    mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
      'string.pattern.base': 'Mobile number must be exactly 10 digits'
    }),
    countryDialCode: Joi.string().optional(),
    fullName: Joi.string().min(2).max(100).optional().messages({
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name cannot exceed 100 characters'
    }),
    tenantId: Joi.string().optional()
  }).or('emailId', 'mobileNumber').messages({
    'object.missing': 'Either email or mobile number is required'
  }),

  login: Joi.object({
    identifier: Joi.string().required().messages({
      'string.base': 'Identifier must be a string',
      'any.required': 'Username, email, or mobile number is required'
    }),
    password: Joi.string().required().messages({
      'string.base': 'Password must be a string',
      'any.required': 'Password is required'
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required'
    })
  }),

  logout: Joi.object({
    token: Joi.string().optional().messages({
      'string.base': 'Token must be a string'
    }),
    allDevices: Joi.boolean().default(false).optional().messages({
      'boolean.base': 'allDevices must be a boolean'
    })
  }).allow({}) // Allow empty body
};
