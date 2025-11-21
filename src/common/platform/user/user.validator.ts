import Joi from 'joi';

/**
 * Joi validation schema for User operations.
 */
export const UserValidator = {
  // 1. Create or Update User
  createOrUpdate: Joi.object({
    personId: Joi.string().optional(),
    userId: Joi.string().optional(),
    password: Joi.string().required(),

    passwordExpiryDate: Joi.date().optional(),
    emailId: Joi.string().email().optional(),
    confirmationToken: Joi.string().optional(),
    tokenGenerationTime: Joi.date().optional(),
    emailValidationStatus: Joi.boolean().optional(),
    passwordRecoveryToken: Joi.string().optional(),
    recoveryTokenTime: Joi.date().optional(),

    countryDialCode: Joi.string().optional(),
    mobileNumber: Joi.string()
      .optional()
      .length(10)
      .pattern(/^\d{10}$/)
      .messages({
        'string.length': 'Mobile number must be exactly 10 digits',
        'string.pattern.base': 'Mobile number must contain only digits',
      }),

    mobileValidationStatus: Joi.boolean().optional(),

    isLocked: Joi.boolean().optional(),
    lockedTillDate: Joi.date().optional(),

    multiSessionCount: Joi.number().integer().min(1).optional(),
    privacyPolicyVersion: Joi.string().optional(),
    profilePictureUrl: Joi.string().uri().optional(),
    metaData: Joi.object().optional().allow(null),

    createdBy: Joi.string().required(),
    updatedBy: Joi.string().required(),
  }),

  // 2. Register
  register: Joi.object({
    personId: Joi.string().optional(),
    userId: Joi.string().required(),
    password: Joi.string().required(),

    passwordExpiryDate: Joi.date().optional(),
    emailId: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    confirmationToken: Joi.string().optional(),
    tokenGenerationTime: Joi.date().optional(),
    emailValidationStatus: Joi.boolean().optional(),
    passwordRecoveryToken: Joi.string().optional(),
    recoveryTokenTime: Joi.date().optional(),

    countryDialCode: Joi.string().optional(),
    mobileNumber: Joi.string()
      .required()
      .length(10)
      .pattern(/^\d{10}$/)
      .messages({
        'string.length': 'Mobile number must be exactly 10 digits',
        'string.pattern.base': 'Mobile number must contain only digits',
        'any.required': 'Mobile number is required',
      }),

    mobileValidationStatus: Joi.boolean().optional(),

    isLocked: Joi.boolean().optional(),
    lockedTillDate: Joi.date().optional(),

    multiSessionCount: Joi.number().integer().min(1).optional(),
    privacyPolicyVersion: Joi.string().optional(),
    profilePictureUrl: Joi.string().uri().optional(),
    metaData: Joi.object().optional().allow(null),

    createdBy: Joi.string().required(),
    updatedBy: Joi.string().required(),
  }),
  // 2. Register
  update: Joi.object({
    personId: Joi.string().optional(),
    userId: Joi.string().required(),
    password: Joi.string().optional(),

    passwordExpiryDate: Joi.date().optional(),
    emailId: Joi.string().email().optional(),
    confirmationToken: Joi.string().optional(),
    tokenGenerationTime: Joi.date().optional(),
    emailValidationStatus: Joi.boolean().optional(),
    passwordRecoveryToken: Joi.string().optional(),
    recoveryTokenTime: Joi.date().optional(),

    countryDialCode: Joi.string().optional(),
    mobileNumber: Joi.string()
      .optional()
      .length(10)
      .pattern(/^\d{10}$/)
      .messages({
        'string.length': 'Mobile number must be exactly 10 digits',
        'string.pattern.base': 'Mobile number must contain only digits',
      }),

    mobileValidationStatus: Joi.boolean().optional(),

    isLocked: Joi.boolean().optional(),
    lockedTillDate: Joi.date().optional(),

    multiSessionCount: Joi.number().integer().min(1).optional(),
    privacyPolicyVersion: Joi.string().optional(),
    profilePictureUrl: Joi.string().uri().optional(),
    metaData: Joi.object().optional().allow(null),

    createdBy: Joi.string().required(),
    updatedBy: Joi.string().required(),
  }),

  // 3. Login
  login: Joi.object({
    identifier: Joi.string().required(),
    password: Joi.string().required(),
  }),

  // 4. Lock user
  lockUnlock: Joi.object({
    id: Joi.string().required(),
  }),

  // 5. Get Profile Header
  getProfileHeaders: Joi.object({
    authorization: Joi.string()
      .required()
      .pattern(/^Bearer\s.+$/),
  }).unknown(true),

  // 6. Send OTP (email/sms)
  sendOTPSchema: Joi.object({
    identifier: Joi.string().required(),
    channel: Joi.string().valid('email', 'sms').required(),
  }),

  // 7. Verify OTP
  verifyOTPSchema: Joi.object({
    identifier: Joi.string().required(),
    otp: Joi.string().required(),
  }),

  // 8. Forgot Password
  forgotPasswordSchema: Joi.object({
    identifier: Joi.string().required(),
  }),

  // 9. Reset Password
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

  // 10. Change Password
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

  // 11. Login with OTP
  loginWithOTPSchema: Joi.object({
    identifier: Joi.string().required(),
    otp: Joi.string().required(),
  }),

  // 12. Confirm Email (token)
  confirmEmail: Joi.object({
    token: Joi.string().required(),
  }),

  // 13. Confirm Mobile
  confirmMobile: Joi.object({
    identifier: Joi.string()
      .optional()
      .length(10)
      .pattern(/^\d{10}$/)
      .messages({
        'string.length': 'Mobile number must be exactly 10 digits',
        'string.pattern.base': 'Mobile number must contain only digits',
      }),
    otp: Joi.string().length(6).required(),
  }),

  // 14. Resend Verification
  resendVerificationSchema: Joi.object({
    identifier: Joi.string().required(),
  }),

  // 15. Attach/Detach Roles
  modifyRoles: Joi.object({
    userId: Joi.string().required(),
    roleIds: Joi.array().items(Joi.string().required()).min(1).required(),
    createdBy: Joi.string().required(),
    updatedBy: Joi.string().required(),
  }),
};

// user.validator.ts - Add this schema
export const createUserWithPersonAndRoles = Joi.object({
  person: Joi.object({
    salutation: Joi.string().optional().allow('', null),
    nameInEnglish: Joi.string().required(),
    nameInLocalLanguage: Joi.string().optional().allow('', null),
    gender: Joi.string().required().valid('Male', 'Female', 'Other'),
    dateOfBirth: Joi.alternatives().try(
      Joi.date().iso().max('now').required(),
      Joi.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .required(),
    ),
    email: Joi.string().email().optional(),
    mobile: Joi.string()
      .optional()
      .pattern(/^[6-9]\d{9}$/),
    createdBy: Joi.string().optional(), // Made optional for updates
    updatedBy: Joi.string().required(),
  }),
  user: Joi.object({
    userId: Joi.string().required(),
    password: Joi.string().optional(), // Made optional for updates
    emailId: Joi.string().email().required(),
    mobileNumber: Joi.string()
      .optional()
      .pattern(/^[6-9]\d{9}$/),
    countryDialCode: Joi.string().optional().allow('', null),
    emailValidationStatus: Joi.boolean().optional(),
    mobileValidationStatus: Joi.boolean().optional(),
    profilePictureUrl: Joi.string().uri().optional().allow('', null),
    isLocked: Joi.boolean().optional(),
    createdBy: Joi.string().optional(), // Made optional for updates
    updatedBy: Joi.string().required(),
  }),
  roles: Joi.array().items(Joi.string().required()).min(1).required(),
});

// Optional: Create a separate validator for updates if needed
export const updateUserWithPersonAndRoles = createUserWithPersonAndRoles;

// Add to user.validator.ts
export const updateProfile = Joi.object({
  person: Joi.object({
    nameInEnglish: Joi.string().optional(),
    gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
    dateOfBirth: Joi.alternatives()
      .try(
        Joi.date().iso().max('now'),
        Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        Joi.string().allow('', null), // Allow empty strings
      )
      .optional(),
    mobile: Joi.string()
      .pattern(/^[6-9]\d{9}$/)
      .optional(),
    email: Joi.string().email().optional(),
  }).optional(),
  // profilePictureUrl: Joi.string().uri().optional(),
  profilePictureUrl: Joi.string().uri().allow('', null).optional(),
});
