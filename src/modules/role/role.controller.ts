import { Request, Response } from 'express';
import { RoleService } from './role.service';
import { errorResponse, getModuleLogger, PaginationInput, successResponse } from '../../utils';


const logger = getModuleLogger('role-controller');

/**
 * Controller layer for Role operations.
 */
export const RoleController = {
  /**
   * @swagger
   *  /o/role:
   *   post:
   *     summary: Create a new role
   *     tags: [Role]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RoleCreateInput'
   *     responses:
   *       201:
   *         description: Role created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Role'
   *       400:
   *         description: Role already exists or invalid priority
   *       500:
   *         description: Failed to create role
   */
  async create(req: Request, res: Response) {
    try {
      const result = await RoleService.create(
        req.body,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ Role created:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 201);
    } catch (error) {
      logger.error('❌ create Role error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        'Failed to create role',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /o/role:
   *   get:
   *     summary: Get all roles
   *     tags: [Role]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of all roles
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Role'
   *       500:
   *         description: Failed to fetch roles
   */
  async getAll(req: Request, res: Response) {
    try {
      const result = await RoleService.getAll(
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ all roles retrieved:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ get all roles error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        'Failed to fetch roles',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   *  /o/role/page:
   *   get:
   *     summary: Get paginated list of roles
   *     tags: [Role]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PaginationInput'
   *     responses:
   *       200:
   *         description: Paginated list of roles
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Role'
   *                 total:
   *                   type: number
   *                 currentPage:
   *                   type: number
   *                 pageSize:
   *                   type: number
   *                 totalPages:
   *                   type: number
   *       500:
   *         description: Failed to fetch paginated roles
   */
  async getAllPaginated(req: Request, res: Response) {
    try {
      const pagination: PaginationInput = req.body?.pagination || {
        page: 1,
        limit: 10,
      };
      const result = await RoleService.getPaginated(
        pagination,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ paginated roles retrieved:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        pagination,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ paginated fetch error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        'Failed to fetch paginated roles',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   *  /o/role/{id}:
   *   get:
   *     summary: Get role by ID
   *     tags: [Role]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     responses:
   *       200:
   *         description: Role details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Role'
   *       404:
   *         description: Role not found
   *       500:
   *         description: Failed to fetch role
   */
  async getById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await RoleService.get(
        id,
        (req as any).requestId,
        (req as any).user?.id,
      );
      if (!result) {
        errorResponse(res, 'Role not found', 404);
        return;
      }
      logger.debug('✅ Role retrieved by ID:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ get by ID error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        'Failed to fetch role',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   *  /o/role/{id}:
   *   put:
   *     summary: Update a role
   *     tags: [Role]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RoleUpdateInput'
   *     responses:
   *       200:
   *         description: Role updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Role'
   *       400:
   *         description: Role already exists or invalid priority
   *       404:
   *         description: Role not found
   *       500:
   *         description: Failed to update role
   */
  async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await RoleService.update(
        id,
        req.body,
        (req as any).requestId,
        (req as any).user?.id,
      );
      if (!result) {
        errorResponse(res, 'Role not found', 404);
        return;
      }
      logger.debug('✅ Role updated:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ update Role error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        'Failed to update role',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   *  /o/role/{id}:
   *   delete:
   *     summary: Delete a role
   *     tags: [Role]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     responses:
   *       200:
   *         description: Role deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Role'
   *       400:
   *         description: Cannot delete active role or role has assigned users
   *       404:
   *         description: Role not found
   *       500:
   *         description: Failed to delete role
   */
  async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await RoleService.delete(
        id,
        (req as any).requestId,
        (req as any).user?.id,
      );
      if (!result) {
        errorResponse(res, 'Role not found', 404);
        return;
      }
      logger.debug('✅ Role deleted:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ delete Role error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        'Failed to delete role',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   *  /role/filtered:
   *   get:
   *     summary: List roles filtered by active status
   *     tags: [Role]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: active
   *         schema:
   *           type: boolean
   *         description: Filter roles by active status (true/false)
   *     responses:
   *       200:
   *         description: Filtered list of roles
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Role'
   *       500:
   *         description: Failed to fetch filtered roles
   */
  async listFiltered(req: Request, res: Response) {
    try {
      const { active } = req.query;
      const activeBool: boolean =
        active === 'true' ? true : active === 'false' ? false : false;
      const result = await RoleService.listFiltered(
        activeBool,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ Filtered roles retrieved:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        active,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ listFiltered error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(res, 'Failed to fetch filtered roles', 500);
    }
  },

  /**
   * @swagger
   *  /o/role/menu/attach:
   *   post:
   *     summary: Attach menus to a role with permissions
   *     tags: [Role]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               roleId:
   *                 type: string
   *                 description: Role ID
   *               menus:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     menuId:
   *                       type: string
   *                       description: Menu ID
   *                     permissions:
   *                       type: array
   *                       items:
   *                         type: string
   *                         enum: [create, read, update, delete]
   *                       description: Permissions for the menu
   *               createdBy:
   *                 type: string
   *                 description: ID of the user creating the association
   *               updatedBy:
   *                 type: string
   *                 description: ID of the user updating the association
   *             required:
   *               - roleId
   *               - menus
   *               - createdBy
   *               - updatedBy
   *     responses:
   *       200:
   *         description: Menus attached successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/RoleMenuAccess'
   *       400:
   *         description: Invalid menu IDs or role not found
   *       500:
   *         description: Failed to attach menus
   */
  async attachMenus(req: Request, res: Response) {
    try {
      const { roleId, menus, createdBy, updatedBy } = req.body;
      const result = await RoleService.attachMenus(
        roleId,
        menus,
        (req as any).requestId,
        (req as any).user?.id,
        createdBy,
        updatedBy,
      );
      logger.debug('✅ Menus attached to role:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        roleId,
        menus,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ attachMenus error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(res, 'Failed to attach menus', 500);
    }
  },

  /**
   * @swagger
   *  /o/role/menu/detach:
   *   post:
   *     summary: Detach menus from a role
   *     tags: [Role]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               roleId:
   *                 type: string
   *                 description: Role ID
   *               menuIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of menu IDs to detach
   *             required:
   *               - roleId
   *               - menuIds
   *     responses:
   *       200:
   *         description: Menus detached successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 count:
   *                   type: number
   *                   description: Number of menus detached
   *       400:
   *         description: Invalid menu IDs or role not active
   *       404:
   *         description: Role not found
   *       500:
   *         description: Failed to detach menus
   */
  async detachMenus(req: Request, res: Response) {
    try {
      const { roleId, menuIds } = req.body;
      const result = await RoleService.detachMenus(
        roleId,
        menuIds,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ Menus detached from role:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        roleId,
        menuIds,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ detachMenus error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(res, 'Failed to detach menus', 500);
    }
  },

  /**
   * @swagger
   *  /o/role/{id}/menus:
   *   get:
   *     summary: Get menus with permissions for a role
   *     tags: [Role]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     responses:
   *       200:
   *         description: List of menus with permissions for the role
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/RoleMenuAccess'
   *       400:
   *         description: Role not active
   *       404:
   *         description: Role not found
   *       500:
   *         description: Failed to get menus for role
   */
  async getRoleMenus(req: Request, res: Response) {
    try {
      const roleId = String(req.params.id);
      const result = await RoleService.getMenusWithPermissions(
        roleId,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ Menus for role fetched:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        roleId,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ getRoleMenus error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(res, 'Failed to get menus for role', 500);
    }
  },

  /**
   * @swagger
   *  /o/role/cache/clear/{id}:
   *   post:
   *     summary: Clear role-menu cache by role ID
   *     tags: [Role]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     responses:
   *       200:
   *         description: Role cache cleared successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       500:
   *         description: Failed to clear cache
   */
  async clearRoleMenuCache(req: Request, res: Response) {
    try {
      const roleId = String(req.params.id);
      const result = await RoleService.clearCache(
        roleId,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ Role menu cache cleared:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        roleId,
        result,
      });
      successResponse(res, { message: 'Cache cleared successfully' });
    } catch (error) {
      logger.error('❌ clearRoleMenuCache error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(res, 'Failed to clear cache', 500);
    }
  },
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique role ID
 *         roleName:
 *           type: string
 *           description: Name of the role
 *         roleCategory:
 *           type: string
 *           description: Category of the role
 *         priority:
 *           type: number
 *           description: Priority of the role (1-10)
 *         isActive:
 *           type: boolean
 *           description: Whether the role is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         createdBy:
 *           type: string
 *           description: ID of the user who created the role
 *         updatedBy:
 *           type: string
 *           description: ID of the user who last updated the role
 *       required:
 *         - id
 *         - roleName
 *         - roleCategory
 *         - priority
 *         - isActive
 *         - createdBy
 *         - updatedBy
 *     RoleCreateInput:
 *       type: object
 *       properties:
 *         roleName:
 *           type: string
 *           description: Name of the role
 *         roleCategory:
 *           type: string
 *           description: Category of the role
 *         priority:
 *           type: number
 *           description: Priority of the role (1-10)
 *         isActive:
 *           type: boolean
 *           description: Whether the role is active
 *           default: true
 *         createdBy:
 *           type: string
 *           description: ID of the user creating the role
 *         updatedBy:
 *           type: string
 *           description: ID of the user updating the role
 *       required:
 *         - roleName
 *         - roleCategory
 *         - priority
 *         - createdBy
 *         - updatedBy
 *     RoleUpdateInput:
 *       type: object
 *       properties:
 *         roleName:
 *           type: string
 *           description: Name of the role
 *         roleCategory:
 *           type: string
 *           description: Category of the role
 *         priority:
 *           type: number
 *           description: Priority of the role (1-10)
 *         isActive:
 *           type: boolean
 *           description: Whether the role is active
 *         updatedBy:
 *           type: string
 *           description: ID of the user updating the role
 *     RoleMenuAccess:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique ID of the role-menu association
 *         roleId:
 *           type: string
 *           description: Role ID
 *         menuId:
 *           type: string
 *           description: Menu ID
 *         create:
 *           type: boolean
 *           description: Whether create permission is granted
 *         read:
 *           type: boolean
 *           description: Whether read permission is granted
 *         update:
 *           type: boolean
 *           description: Whether update permission is granted
 *         delete:
 *           type: boolean
 *           description: Whether delete permission is granted
 *         createdBy:
 *           type: string
 *           description: ID of the user who created the association
 *         updatedBy:
 *           type: string
 *           description: ID of the user who last updated the association
 *         menu:
 *           type: object
 *           description: Associated menu details
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             path:
 *               type: string
 *       required:
 *         - id
 *         - roleId
 *         - menuId
 *         - create
 *         - read
 *         - update
 *         - delete
 *         - createdBy
 *         - updatedBy
 *     PaginationInput:
 *       type: object
 *       properties:
 *         page:
 *           type: number
 *           description: Page number
 *           default: 1
 *         limit:
 *           type: number
 *           description: Number of items per page
 *           default: 10
 *         filters:
 *           type: object
 *           description: Additional filters (optional)
 *       required:
 *         - page
 *         - limit
 */
