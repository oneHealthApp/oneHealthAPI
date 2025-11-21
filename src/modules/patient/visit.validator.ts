import Joi from 'joi';

/**
 * Validation schemas for Visit operations
 */
export const VisitValidator = {
  create: Joi.object({
    tenantId: Joi.string().required().messages({
      'string.empty': 'Tenant ID is required',
      'any.required': 'Tenant ID is required',
    }),
    clinicId: Joi.string().required().messages({
      'string.empty': 'Clinic ID is required',
      'any.required': 'Clinic ID is required',
    }),
    patientId: Joi.string().required().messages({
      'string.empty': 'Patient ID is required',
      'any.required': 'Patient ID is required',
    }),
    doctorId: Joi.string().optional().allow(null),
    visitType: Joi.string().valid('CLINIC', 'HOME', 'ON_CALL', 'FARM').optional().messages({
      'any.only': 'Visit type must be one of: CLINIC, HOME, ON_CALL, FARM',
    }),
    vitals: Joi.object({
      temperature: Joi.number().min(90).max(110).optional().messages({
        'number.min': 'Temperature must be at least 90°F',
        'number.max': 'Temperature must be at most 110°F',
      }),
      pulse: Joi.number().min(40).max(200).optional().messages({
        'number.min': 'Pulse must be at least 40 bpm',
        'number.max': 'Pulse must be at most 200 bpm',
      }),
      bp: Joi.string().pattern(/^\d{2,3}\/\d{2,3}$/).optional().messages({
        'string.pattern.base': 'Blood pressure must be in format: 120/80',
      }),
      spo2: Joi.number().min(70).max(100).optional().messages({
        'number.min': 'SpO2 must be at least 70%',
        'number.max': 'SpO2 must be at most 100%',
      }),
    }).optional(),
    symptoms: Joi.string().max(1000).optional().allow('').messages({
      'string.max': 'Symptoms description cannot exceed 1000 characters',
    }),
    notes: Joi.string().max(2000).optional().allow('').messages({
      'string.max': 'Notes cannot exceed 2000 characters',
    }),
  }),

  update: Joi.object({
    visitType: Joi.string().valid('CLINIC', 'HOME', 'ON_CALL', 'FARM').optional(),
    doctorId: Joi.string().optional().allow(null),
    vitals: Joi.object({
      temperature: Joi.number().min(90).max(110).optional(),
      pulse: Joi.number().min(40).max(200).optional(),
      bp: Joi.string().pattern(/^\d{2,3}\/\d{2,3}$/).optional(),
      spo2: Joi.number().min(70).max(100).optional(),
    }).optional(),
    symptoms: Joi.string().max(1000).optional().allow(''),
    notes: Joi.string().max(2000).optional().allow(''),
    workflowState: Joi.string().valid('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').optional(),
    endedAt: Joi.date().optional().allow(null),
  }),
};
