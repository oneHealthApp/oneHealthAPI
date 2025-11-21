import Joi from 'joi';

/**
 * Joi validation schema for Patient create/update operations.
 */
export const PatientValidator = {
  create: Joi.object({
    tenantId: Joi.string().optional(), // Make optional since it can be derived from clinicId
    clinicId: Joi.string().required().messages({
      'any.required': 'Clinic ID is required',
      'string.empty': 'Clinic ID cannot be empty'
    }),
    pseudonymId: Joi.string().optional().messages({
      'string.empty': 'Pseudonym ID cannot be empty'
    }),
    type: Joi.string().valid('HUMAN', 'PET', 'LIVESTOCK').required().messages({
      'any.required': 'Patient type is required',
      'any.only': 'Patient type must be one of: HUMAN, PET, LIVESTOCK'
    }),
    age: Joi.number().integer().min(0).max(200).optional().allow(null),
    sex: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'UNKNOWN').optional().allow('', null),
    species: Joi.string().valid('DOG', 'CAT', 'COW', 'GOAT', 'SHEEP', 'PIG', 'OTHER').optional().allow(null),
    breed: Joi.string().max(100).optional().allow('', null),
    hasIdentifyingInfo: Joi.boolean().optional().default(false),
    externalId: Joi.string().max(50).optional().allow('', null),
    ownerId: Joi.string().optional().allow('', null),
    addressId: Joi.string().optional().allow('', null),
    person: Joi.object({
      firstName: Joi.string().min(1).max(50).optional().allow('', null),
      lastName: Joi.string().min(1).max(50).optional().allow('', null),
      fullName: Joi.string().min(2).max(100).optional().allow('', null),
      phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{10,15}$/).optional().allow('', null),
      email: Joi.string().email().optional().allow('', null),
      dateOfBirth: Joi.alternatives().try(
        Joi.date().iso(),
        Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)
      ).optional().allow(null),
      gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'UNKNOWN').optional().allow('', null),
      sex: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'UNKNOWN').optional().allow('', null)
    }).optional(),
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
      geoLocation: Joi.object({
        lat: Joi.number().optional(),
        lng: Joi.number().optional()
      }).optional()
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
    clinicId: Joi.string().optional().allow('', null),
    pseudonymId: Joi.string().optional(),
    type: Joi.string().valid('HUMAN', 'PET', 'LIVESTOCK').optional(),
    age: Joi.number().integer().min(0).max(200).optional().allow(null),
    sex: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'UNKNOWN').optional().allow('', null),
    species: Joi.string().valid('DOG', 'CAT', 'COW', 'GOAT', 'SHEEP', 'PIG', 'OTHER').optional().allow(null),
    breed: Joi.string().max(100).optional().allow('', null),
    hasIdentifyingInfo: Joi.boolean().optional(),
    externalId: Joi.string().max(50).optional().allow('', null),
    ownerId: Joi.string().optional().allow('', null),
    addressId: Joi.string().optional().allow('', null),
    person: Joi.object({
      firstName: Joi.string().min(1).max(50).optional().allow('', null),
      lastName: Joi.string().min(1).max(50).optional().allow('', null),
      fullName: Joi.string().min(2).max(100).optional().allow('', null),
      phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{10,15}$/).optional().allow('', null),
      email: Joi.string().email().optional().allow('', null),
      dateOfBirth: Joi.alternatives().try(
        Joi.date().iso(),
        Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)
      ).optional().allow(null),
      gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'UNKNOWN').optional().allow('', null),
      sex: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'UNKNOWN').optional().allow('', null)
    }).optional(),
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
      geoLocation: Joi.object({
        lat: Joi.number().optional(),
        lng: Joi.number().optional()
      }).optional()
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
    clinicId: Joi.string().optional(),
    type: Joi.string().valid('HUMAN', 'PET', 'LIVESTOCK').optional(),
    species: Joi.string().valid('DOG', 'CAT', 'COW', 'GOAT', 'SHEEP', 'PIG', 'OTHER').optional(),
    ownerId: Joi.string().optional(),
    hasIdentifyingInfo: Joi.boolean().optional(),
    search: Joi.string().max(100).optional()
  }),

  bulkCreate: Joi.object({
    patients: Joi.array().items(
      Joi.object({
        tenantId: Joi.string().optional(),
        clinicId: Joi.string().required(),
        pseudonymId: Joi.string().optional(),
        type: Joi.string().valid('HUMAN', 'PET', 'LIVESTOCK').required(),
        age: Joi.number().integer().min(0).max(200).optional().allow(null),
        sex: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'UNKNOWN').optional().allow('', null),
        species: Joi.string().valid('DOG', 'CAT', 'COW', 'GOAT', 'SHEEP', 'PIG', 'OTHER').optional().allow(null),
        breed: Joi.string().max(100).optional().allow('', null),
        hasIdentifyingInfo: Joi.boolean().optional().default(false),
        externalId: Joi.string().max(50).optional().allow('', null),
        ownerId: Joi.string().optional().allow('', null),
        addressId: Joi.string().optional().allow('', null),
        person: Joi.object({
          firstName: Joi.string().min(1).max(50).optional().allow('', null),
          lastName: Joi.string().min(1).max(50).optional().allow('', null),
          fullName: Joi.string().min(2).max(100).optional().allow('', null),
          phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{10,15}$/).optional().allow('', null),
          email: Joi.string().email().optional().allow('', null),
          dateOfBirth: Joi.alternatives().try(
            Joi.date().iso(),
            Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)
          ).optional().allow(null),
          gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'UNKNOWN').optional().allow('', null),
          sex: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'UNKNOWN').optional().allow('', null)
        }).optional(),
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
          geoLocation: Joi.object({
            lat: Joi.number().optional(),
            lng: Joi.number().optional()
          }).optional()
        }).optional().when('addressId', {
          is: Joi.exist(),
          then: Joi.forbidden(),
          otherwise: Joi.optional()
        })
      })
    ).min(1).max(100).required().messages({
      'array.min': 'At least one patient is required',
      'array.max': 'Maximum 100 patients can be created at once'
    })
  })
};
