import Joi from 'joi';
import { env } from '../../../utils';

/**
 * Joi validation schema for Auth operations.
 */
export const AuthValidator = {
  login: Joi.object({
    identifier: Joi.string().required().messages({
      'string.empty': 'Identifier is required',
      'any.required': 'Identifier is required',
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
    }),
  }),
  generateOtp: Joi.object({
    identifier: Joi.string().required(),
    channel: Joi.string().valid('sms', 'email').optional(),
  }),

  verifyOtp: Joi.object({
    identifier: Joi.string().required(),
    otp: Joi.string()
      .required()
      .pattern(/^\d+$/)
      .message('OTP must be numeric'),
    mobileAppSettings: Joi.object({
      appInstanceId: Joi.string().optional(),
      appName: Joi.string().required(),
      platform: Joi.string().valid('ANDROID', 'IOS').required(),
      fcmId: Joi.string().required(),
      version: Joi.string().required(),
      deviceInfo: Joi.object().optional(),
      metaData: Joi.object().optional(),
    }).optional(),
  }),

  // auth.validator.ts - Update forgotPassword validator
  forgotPassword: Joi.object({
    identifier: Joi.string()
      .required()
      .custom((value, helpers) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const mobileRegex = /^\d{10}$/;
        if (emailRegex.test(value) || mobileRegex.test(value)) {
          return value;
        }
        return helpers.error('string.invalidIdentifier');
      })
      .messages({
        'string.empty': 'Identifier is required',
        'any.required': 'Identifier is required',
        'string.invalidIdentifier':
          'Identifier must be a valid email or 10-digit mobile number',
      }),
    channel: Joi.string().valid('sms', 'email').optional().messages({
      'any.only': 'Channel must be either "sms" or "email"',
    }),
  }),

  resetPassword: Joi.object({
    identifier: Joi.string().required(),
    token: Joi.string().required(),
    newPassword: Joi.string()
      .required()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      )
      .message(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      ),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
      .required()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      )
      .message(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      ),
  }),

  verifyOtpForPasswordReset: Joi.object({
    identifier: Joi.string().required(),
    otp: Joi.string()
      .required()
      .length(env.OTP_LENGTH || 6),
  }),

  resendOtp: Joi.object({
    identifier: Joi.string().required(),
    channel: Joi.string().valid('sms', 'email').optional(),
    purpose: Joi.string().valid('login', 'password_reset').required(),
  }),

  mobileAppSettings: Joi.object({
    appName: Joi.string().required().max(100),
    platform: Joi.string().valid('ANDROID', 'IOS').required(),
    fcmId: Joi.string().required().max(500),
    version: Joi.string().required().max(50),
    deviceInfo: Joi.object().optional(),
    metaData: Joi.object().optional(),
  }).optional(),
};
