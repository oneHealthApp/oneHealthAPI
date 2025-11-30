import Joi from 'joi';

export const UserValidator = {
  register: Joi.object({
    personId: Joi.string().optional(),
    userId: Joi.string().required(),
    password: Joi.string().required(),

    emailId: Joi.string().email().optional(),
    countryDialCode: Joi.string().optional(),
    mobileNumber: Joi.string().optional(),

    privacyPolicyVersion: Joi.string().optional(),
    profilePictureUrl: Joi.string().uri().optional(),
    metaData: Joi.object().optional().allow(null), // JSON field

    isLocked: Joi.boolean().optional(),
    lockedTillDate: Joi.date().optional(),
    multiSessionCount: Joi.number().integer().min(1).optional(),

    createdBy: Joi.string().required(), 
    updatedBy: Joi.string().required(), 
  }),

  login: Joi.object({
    identifier: Joi.string().required(), // could be userId/email/mobile depending on logic
    password: Joi.string().required(),
  }),

  blockUserSchema: Joi.object({
    identifier: Joi.string().required(),
  }),
  unblockUserSchema: Joi.object({
    identifier: Joi.string().required(),
  }),
  refreshTokenSchema: Joi.object({
    refreshToken: Joi.string().required(),
  }),
  getProfileHeaders: Joi.object({
    authorization: Joi.string()
      .required()
      .pattern(/^Bearer\s.+$/),
  }).unknown(true),

  sendOTPSchema: Joi.object({
    identifier: Joi.string().required(),
    channel: Joi.string().valid('email', 'sms').required(),
  }),
  verifyOTPSchema: Joi.object({
    identifier: Joi.string().required(),
    otp: Joi.string().required(),
  }),
  forgotPasswordSchema: Joi.object({
    identifier: Joi.string().required(),
  }),
  resetPasswordSchema: Joi.object({
    identifier: Joi.string().required(),
    otp: Joi.string().required(),
    newPassword: Joi.string().required(),
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Confirm password must match new password',
      }),
  }),
  changePasswordSchema: Joi.object({
    currentPassword: Joi.string().required().messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required',
    }),
    newPassword: Joi.string().required().messages({
      'any.required': 'New password is required',
    }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Passwords must match',
        'any.required': 'Confirm password is required',
      }),
  }),
  loginWithOTPSchema: Joi.object({
    identifier: Joi.string().required(),
    otp: Joi.string().required(),
  }),
  verifyEmailSchema: Joi.object({
    token: Joi.string().required(),
  }),
  verifyPhoneSchema: Joi.object({
    identifier: Joi.string().required(),
    otp: Joi.string().required(),
  }),
    resendVerificationSchema: Joi.object({
    identifier: Joi.string().required(),
  }),

  createStaff: Joi.object({
    tenantId: Joi.string().required().messages({
      'string.empty': 'Tenant ID is required',
      'any.required': 'Tenant ID is required',
    }),
    clinicId: Joi.string().required().messages({
      'string.empty': 'Clinic ID is required', 
      'any.required': 'Clinic ID is required',
    }),
    name: Joi.string().min(2).max(100).required().messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required',
    }),
    phoneNumber: Joi.string().pattern(/^[0-9]{10,15}$/).required().messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Phone number must be 10-15 digits',
      'any.required': 'Phone number is required',
    }),
    email: Joi.string().email().required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be valid',
      'any.required': 'Email is required',
    }),
    username: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9_]+$/).required().messages({
      'string.empty': 'Username is required',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 50 characters',
      'string.pattern.base': 'Username can only contain letters, numbers and underscores',
      'any.required': 'Username is required',
    }),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character',
      'any.required': 'Password is required',
    }),
    sex: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional(),
    roleId: Joi.string().required().messages({
      'string.empty': 'Role ID is required',
      'any.required': 'Role ID is required',
    }),
  }),
  
};
