import Joi from 'joi';

/**
 * Joi validation schema for Clinic create/update operations.
 */
export const ClinicValidator = {
  create: Joi.object({
    tenantId: Joi.string().optional().allow('', null),
    tenantName: Joi.string().min(2).max(100).optional().allow('', null),
    tenantSlug: Joi.string().optional().allow('', null),
    name: Joi.string().min(2).max(100).required().messages({
      'any.required': 'Clinic name is required',
      'string.empty': 'Clinic name cannot be empty',
      'string.min': 'Clinic name must be at least 2 characters',
      'string.max': 'Clinic name cannot exceed 100 characters'
    }),
    clinicType: Joi.string().valid('HUMAN', 'PET', 'LIVESTOCK').required().messages({
      'any.required': 'Clinic type is required',
      'any.only': 'Clinic type must be one of: HUMAN, PET, LIVESTOCK'
    }),
    isActive: Joi.boolean().optional().default(true),
    addressId: Joi.string().optional().allow('', null),
    phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{10,15}$/).optional().allow('', null).messages({
      'string.pattern.base': 'Phone number must be a valid format (10-15 digits)'
    }),
    email: Joi.string().email().optional().allow('', null).messages({
      'string.email': 'Email must be a valid email address'
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
    tenantId: Joi.string().optional(),
    name: Joi.string().min(2).max(100).optional().messages({
      'string.min': 'Clinic name must be at least 2 characters',
      'string.max': 'Clinic name cannot exceed 100 characters'
    }),
    clinicType: Joi.string().valid('HUMAN', 'PET', 'LIVESTOCK').optional(),
    isActive: Joi.boolean().optional(),
    addressId: Joi.string().optional().allow('', null),
    phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{10,15}$/).optional().allow('', null).messages({
      'string.pattern.base': 'Phone number must be a valid format (10-15 digits)'
    }),
    email: Joi.string().email().optional().allow('', null).messages({
      'string.email': 'Email must be a valid email address'
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
  }).min(1),

  filter: Joi.object({
    tenantId: Joi.string().optional(),
    clinicType: Joi.string().valid('HUMAN', 'PET', 'LIVESTOCK').optional(),
    isActive: Joi.boolean().optional(),
    search: Joi.string().max(100).optional()
  }),

  bulkCreate: Joi.object({
    clinics: Joi.array().items(
      Joi.object({
        tenantId: Joi.string().required(),
        name: Joi.string().min(2).max(100).required(),
        clinicType: Joi.string().valid('HUMAN', 'PET', 'LIVESTOCK').required(),
        isActive: Joi.boolean().optional().default(true),
        addressId: Joi.string().optional().allow('', null),
        phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{10,15}$/).optional().allow('', null),
        email: Joi.string().email().optional().allow('', null),
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
          then: Joi.forbidden(),
          otherwise: Joi.optional()
        })
      })
    ).min(1).max(50).required().messages({
      'array.min': 'At least one clinic is required',
      'array.max': 'Maximum 50 clinics can be created at once'
    })
  })
};
