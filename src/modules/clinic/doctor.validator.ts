import Joi from 'joi';

/**
 * Joi validation schema for Doctor creation operations.
 */
export const DoctorValidator = {
  create: Joi.object({
    // Required fields
    firstName: Joi.string().min(2).max(50).required().messages({
      'any.required': 'First name is required',
      'string.empty': 'First name cannot be empty',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      'any.required': 'Last name is required',
      'string.empty': 'Last name cannot be empty',
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
    phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{10,15}$/).required().messages({
      'any.required': 'Phone number is required',
      'string.pattern.base': 'Phone number must be a valid format (10-15 digits)',
      'string.empty': 'Phone number cannot be empty'
    }),
    email: Joi.string().email().required().messages({
      'any.required': 'Email is required',
      'string.email': 'Email must be a valid email address',
      'string.empty': 'Email cannot be empty'
    }),
    username: Joi.string().min(3).max(30).alphanum().required().messages({
      'any.required': 'Username is required',
      'string.empty': 'Username cannot be empty',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 30 characters',
      'string.alphanum': 'Username must contain only letters and numbers'
    }),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
      'any.required': 'Password is required',
      'string.empty': 'Password cannot be empty',
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    }),
    clinicId: Joi.string().required().messages({
      'any.required': 'Clinic ID is required',
      'string.empty': 'Clinic ID cannot be empty'
    }),
    tenantId: Joi.string().required().messages({
      'any.required': 'Tenant ID is required',
      'string.empty': 'Tenant ID cannot be empty'
    }),
    sex: Joi.string().valid('MALE', 'FEMALE', 'OTHER').required().messages({
      'any.required': 'Sex is required',
      'any.only': 'Sex must be one of: MALE, FEMALE, OTHER'
    }),
    
    // Optional fields
    middleName: Joi.string().min(1).max(50).optional().allow('').messages({
      'string.min': 'Middle name must be at least 1 character',
      'string.max': 'Middle name cannot exceed 50 characters'
    }),
    dateOfBirth: Joi.date().iso().max('now').optional().messages({
      'date.base': 'Date of birth must be a valid date',
      'date.max': 'Date of birth cannot be in the future'
    }),
    externalId: Joi.string().max(100).optional().allow('').messages({
      'string.max': 'External ID cannot exceed 100 characters'
    }),
    signatureUrl: Joi.string().uri().optional().allow('').messages({
      'string.uri': 'Signature URL must be a valid URL'
    }),
    profileImageUrl: Joi.string().uri().optional().allow('').messages({
      'string.uri': 'Profile image URL must be a valid URL'
    }),
    
    // Address fields - either provide addressId OR address object
    addressId: Joi.string().optional().allow('').messages({
      'string.empty': 'Address ID cannot be empty if provided'
    }),
    address: Joi.object({
      address: Joi.string().required().messages({
        'any.required': 'Address is required',
        'string.empty': 'Address cannot be empty'
      }),
      townCode: Joi.string().required(),
      town: Joi.string().required(),
      pin: Joi.string().pattern(/^[0-9]{6}$/).required().messages({
        'string.pattern.base': 'Pin code must be 6 digits'
      }),
      subDistrictCode: Joi.string().required(),
      subDistrict: Joi.string().required(),
      districtCode: Joi.string().required(),
      district: Joi.string().required(),
      stateCode: Joi.string().required(),
      state: Joi.string().required(),
      countryId: Joi.string().required(),
      countryName: Joi.string().required(),
      geoLocation: Joi.object().optional()
    }).optional().when('addressId', {
      is: Joi.exist(),
      then: Joi.forbidden().messages({
        'object.unknown': 'Cannot provide both addressId and address object'
      }),
      otherwise: Joi.optional()
    })
  }),
  
  update: Joi.object({
    firstName: Joi.string().min(2).max(50).optional().messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters'
    }),
    lastName: Joi.string().min(2).max(50).optional().messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
    middleName: Joi.string().min(1).max(50).optional().allow('').messages({
      'string.min': 'Middle name must be at least 1 character',
      'string.max': 'Middle name cannot exceed 50 characters'
    }),
    phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{10,15}$/).optional().messages({
      'string.pattern.base': 'Phone number must be a valid format (10-15 digits)'
    }),
    email: Joi.string().email().optional().messages({
      'string.email': 'Email must be a valid email address'
    }),
    dateOfBirth: Joi.date().iso().max('now').optional().messages({
      'date.base': 'Date of birth must be a valid date',
      'date.max': 'Date of birth cannot be in the future'
    }),
    sex: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional().messages({
      'any.only': 'Sex must be one of: MALE, FEMALE, OTHER'
    }),
    externalId: Joi.string().max(100).optional().allow('').messages({
      'string.max': 'External ID cannot exceed 100 characters'
    }),
    signatureUrl: Joi.string().uri().optional().allow('').messages({
      'string.uri': 'Signature URL must be a valid URL'
    }),
    profileImageUrl: Joi.string().uri().optional().allow('').messages({
      'string.uri': 'Profile image URL must be a valid URL'
    }),
    isActive: Joi.boolean().optional(),
    addressId: Joi.string().optional().allow('').messages({
      'string.empty': 'Address ID cannot be empty if provided'
    }),
    address: Joi.object({
      address: Joi.string().required(),
      townCode: Joi.string().required(),
      town: Joi.string().required(),
      pin: Joi.string().pattern(/^[0-9]{6}$/).required(),
      subDistrictCode: Joi.string().required(),
      subDistrict: Joi.string().required(),
      districtCode: Joi.string().required(),
      district: Joi.string().required(),
      stateCode: Joi.string().required(),
      state: Joi.string().required(),
      countryId: Joi.string().required(),
      countryName: Joi.string().required(),
      geoLocation: Joi.object().optional()
    }).optional().when('addressId', {
      is: Joi.exist(),
      then: Joi.forbidden().messages({
        'object.unknown': 'Cannot provide both addressId and address object'
      }),
      otherwise: Joi.optional()
    })
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  }),

  filter: Joi.object({
    clinicId: Joi.string().optional(),
    tenantId: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    search: Joi.string().max(100).optional().messages({
      'string.max': 'Search term cannot exceed 100 characters'
    })
  })
};