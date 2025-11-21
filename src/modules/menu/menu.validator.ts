import Joi from 'joi';

// Shared schema fields for menu validation
const menuSchemaFields = {
  menuName: Joi.string().max(100).required().messages({
    'string.empty': 'Menu name is required',
    'string.max': 'Menu name cannot exceed {#limit} characters',
  }),

  path: Joi.string().required().messages({
    'string.empty': 'Path is required',
  }),

  menuIcon: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Menu icon must be a string',
  }),

  layout: Joi.string()
    .valid('main', 'blank', 'auth', 'admin')
    .required()
    .messages({
      'any.only': 'Layout must be one of: main, blank, auth, admin',
      'any.required': 'Layout is required',
    }),

  displayOrdinal: Joi.number()
    .integer()
    .min(0)
    .max(32767) // Matches @db.SmallInt
    .messages({
      'number.base': 'Display ordinal must be a number',
      'number.integer': 'Display ordinal must be an integer',
      'number.min': 'Display ordinal cannot be negative',
      'number.max': 'Display ordinal exceeds maximum value',
    }),

  childOf: Joi.string().trim().uuid().optional().allow(null, '').messages({
    'string.guid': 'Parent menu ID must be a valid UUID',
  }),
};

export const MenuValidator = {
  // Strict validation for CREATE (all fields required)
  create: Joi.object({
    ...menuSchemaFields,
    displayOrdinal: menuSchemaFields.displayOrdinal.required(), // Explicitly required for create
    createdBy: Joi.string().trim().uuid().required().messages({
      'any.required': 'Creator ID is required',
      'string.guid': 'Creator ID must be a valid UUID',
    }),
    updatedBy: Joi.string().trim().uuid().required().messages({
      'any.required': 'Updater ID is required',
      'string.guid': 'Updater ID must be a valid UUID',
    }),
  }).options({ abortEarly: false }),

  // Flexible validation for UPDATE (only updatedBy required)
  update: Joi.object({
    ...menuSchemaFields,
    displayOrdinal: menuSchemaFields.displayOrdinal.optional(), // Optional for update
    updatedBy: Joi.string().trim().uuid().required().messages({
      'any.required': 'Updater ID is required',
      'string.guid': 'Updater ID must be a valid UUID',
    }),
  }).options({ abortEarly: false }),

  // Optional: Schema for bulk operations (unchanged)
  bulkCreate: Joi.array().items(
    Joi.object({
      ...menuSchemaFields,
      createdBy: Joi.string().trim().uuid().required(),
      updatedBy: Joi.string().trim().uuid().required(),
    }),
  ),
};
