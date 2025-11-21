import Joi from 'joi';

// Common validation rules (reusable across single and bulk operations)
const baseRoleMenuAccessSchema = {
  roleId: Joi.string()
    .pattern(/^c[a-z0-9]{24}$/)
    .required()
    .messages({
      'string.empty': 'Role ID is required',
      'string.pattern.base': 'Role ID must be a valid CUID',
      'any.required': 'Role ID is required',
    }),
  menuId: Joi.string()
    .pattern(/^c[a-z0-9]{24}$/)
    .required()
    .messages({
      'string.empty': 'Menu ID is required',
      'string.pattern.base': 'Menu ID must be a valid CUID',
      'any.required': 'Menu ID is required',
    }),
  create: Joi.boolean().default(true),
  read: Joi.boolean().default(true),
  update: Joi.boolean().default(true),
  delete: Joi.boolean().default(true),
  createdBy: Joi.string().required(),
  updatedBy: Joi.string().required(),
};

// Error messages for bulk operations
const bulkErrorMessages = {
  'array.base': 'Payload must be an array of RoleMenuAccess objects',
  'array.min': 'At least one RoleMenuAccess record is required',
  'array.max': 'Cannot process more than {#limit} records at once',
};

export const RoleMenuAccessValidator = {
  // Single record creation
  create: Joi.object(baseRoleMenuAccessSchema).options({ abortEarly: false }),

  // Single record update
  update: Joi.object({
    roleId: Joi.string()
      .pattern(/^c[a-z0-9]{24}$/)
      .optional(),
    menuId: Joi.string()
      .pattern(/^c[a-z0-9]{24}$/)
      .optional(),
    create: Joi.boolean().optional(),
    read: Joi.boolean().optional(),
    update: Joi.boolean().optional(),
    delete: Joi.boolean().optional(),
    updatedBy: Joi.string().required(),
  }).options({ abortEarly: false }),

  // Bulk creation (array of records)
  bulkCreate: Joi.array()
    .items(Joi.object(baseRoleMenuAccessSchema).options({ abortEarly: false }))
    .min(1)
    .max(100) // Adjust based on your performance requirements
    .messages(bulkErrorMessages)
    .options({
      abortEarly: false,
      stripUnknown: true, // Ignore unexpected fields in bulk items
    }),

  // Bulk update (array of partial records with IDs)
  bulkUpdate: Joi.array()
    .items(
      Joi.object({
        id: Joi.string()
          .pattern(/^c[a-z0-9]{24}$/)
          .required(),
        ...baseRoleMenuAccessSchema,
        createdBy: Joi.forbidden(), // Shouldn't update createdBy in bulk updates
        updatedBy: Joi.string().required(),
      }),
    )
    .min(1)
    .max(100)
    .messages(bulkErrorMessages)
    .options({ abortEarly: false }),
};
