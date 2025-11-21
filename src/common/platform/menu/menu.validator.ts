import Joi from 'joi';

const menuBaseSchema = {
  menuName: Joi.string().max(100).required().messages({
    'string.empty': 'Menu name is required',
    'string.max': 'Menu name cannot exceed {#limit} characters',
  }),
  path: Joi.string().required().messages({
    'string.empty': 'Path is required',
  }),
  menuIcon: Joi.string().optional().allow(null, ''),
  layout: Joi.string()
    .valid('main', 'blank', 'auth', 'admin', 'modern')
    .required(),
  displayOrdinal: Joi.number().integer().min(0).required(),
  isActive: Joi.boolean().default(true),
  childOf: Joi.string().optional().allow(null, ''), // removed .uuid()
};

export const MenuValidator = {
  create: Joi.object({
    ...menuBaseSchema,
    createdBy: Joi.string().required(),
    updatedBy: Joi.string().required(),

    subMenus: Joi.array()
      .items(
        Joi.object({
          menuName: Joi.string().max(100).required(),
          path: Joi.string().required(),
          layout: Joi.string()
            .valid('main', 'blank', 'auth', 'admin', 'modern')
            .required(),
          displayOrdinal: Joi.number().integer().min(0).required(),
          isActive: Joi.boolean().default(true),
          menuIcon: Joi.string().optional().allow(null, ''),
          childOf: Joi.string().optional().allow(null, ''),
          createdBy: Joi.string().required(),
          updatedBy: Joi.string().required(),
        }),
      )
      .optional(),
  }),

  update: Joi.object({
    menuName: Joi.string().max(100).optional(),
    path: Joi.string().optional(),
    menuIcon: Joi.string().optional().allow(null, ''),
    layout: Joi.string()
      .valid('main', 'blank', 'auth', 'admin', 'modern')
      .optional(),
    displayOrdinal: Joi.number().integer().min(0).optional(),
    isActive: Joi.boolean().optional(),
    childOf: Joi.string().optional().allow(null, ''), // text ID allowed
    updatedBy: Joi.string().required(),
    subMenus: Joi.array()
      .items(
        Joi.object({
          menuName: Joi.string().max(100).required(),
          path: Joi.string().required(),
          layout: Joi.string()
            .valid('main', 'blank', 'auth', 'admin', 'modern')
            .required(),
          displayOrdinal: Joi.number().integer().min(0).required(),
          isActive: Joi.boolean().default(true),
          createdBy: Joi.string().required(),
          updatedBy: Joi.string().required(),
        }),
      )
      .optional(),
  }),

  list: Joi.object({
    active: Joi.boolean().optional(),
  }),
};
