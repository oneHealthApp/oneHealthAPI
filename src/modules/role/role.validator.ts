import Joi from 'joi';

/**
 * Joi validation schema for Role operations.
 */
export const RoleValidator = {
  // 1. Create  Role
  create: Joi.object({
    roleName: Joi.string().required(),
    roleCategory: Joi.string().required(),
    priority: Joi.number().integer().min(1).max(10).required(),
    isActive: Joi.boolean().optional().default(true),
    createdBy: Joi.string().required(),
    updatedBy: Joi.string().required(),
  }),

  //  Update Role
  update: Joi.object({
    roleName: Joi.string().optional(),
    roleCategory: Joi.string().optional(),
    priority: Joi.number().integer().min(1).max(10).optional(),
    isActive: Joi.boolean().optional(),
    updatedBy: Joi.string().required(),
  }),

  // 3. Attach Menus to Role
  // RoleValidator.ts
  attachMenus: Joi.object({
    roleId: Joi.string().required(),
    menus: Joi.array()
      .items(
        Joi.object({
          menuId: Joi.string().required(),
          permissions: Joi.array()
            .items(Joi.string().valid('create', 'read', 'update', 'delete'))
            .required(),
        }),
      )
      .min(1)
      .required(),
    createdBy: Joi.string().required(),
    updatedBy: Joi.string().required(),
  }),

  // 4. Detach Menus from Role
  detachMenus: Joi.object({
    roleId: Joi.string().required(),
    menuIds: Joi.array().items(Joi.string().required()).min(1).required(),
    createdBy: Joi.string().required(),
    updatedBy: Joi.string().required(),
  }),

  // 5. Get Menus for Role (usually validated via param middleware, but added for completeness)
  getMenusByRole: Joi.object({
    id: Joi.string().required(),
  }),

  // 6. Clear Role Menu Cache
  clearRoleMenuCache: Joi.object({
    id: Joi.string().required(),
  }),
};
