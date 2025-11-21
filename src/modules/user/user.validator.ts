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
  
};
