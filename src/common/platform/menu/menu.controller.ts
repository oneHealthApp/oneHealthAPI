import { Request, Response } from 'express';
import {
  successResponse,
  errorResponse,
  getModuleLogger,
} from '../../../utils';
import { MenuService } from './menu.service';

const logger = getModuleLogger('menu-controller');

const service = new MenuService();

/**
 * Controller layer for Menu operations.
 */
export const MenuController = {
  /**
   * @swagger
   * /platform/menu:
   *   get:
   *     summary: List all menus
   *     tags: [Menu]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: active
   *         schema:
   *           type: boolean
   *         description: Filter menus by active status (true/false)
   *     responses:
   *       200:
   *         description: List of menus
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Menu'
   *       500:
   *         description: Failed to list menus
   */
  async listAllMenus(req: Request, res: Response) {
    try {
      const { active } = req.query;
      const isActive =
        active === 'true' ? true : active === 'false' ? false : undefined;

      const result = await service.listAllMenus(
        isActive,
        (req as any).requestId,
        (req as any).user?.id,
      );

      logger.debug('✅ Menus listed successfully', {
        requestId: (req as any).requestId,
        count: result?.length || 0,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error('❌ Failed to list menus', {
        requestId: (req as any).requestId,
        error,
      });
      errorResponse(
        res,
        'Failed to list menus',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/menu/{id}:
   *   get:
   *     summary: Get a menu by ID
   *     tags: [Menu]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Menu ID
   *     responses:
   *       200:
   *         description: Menu details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Menu'
   *       404:
   *         description: Menu not found
   *       500:
   *         description: Failed to get menu
   */
  async getMenuById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await service.getMenuById(
        id,
        (req as any).requestId,
        (req as any).user?.id,
      );

      if (!result) {
        errorResponse(res, 'Menu not found', 404);
        return;
      }

      logger.debug('✅ Menu retrieved by ID', {
        requestId: (req as any).requestId,
        menuId: id,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error('❌ Failed to get menu by ID', {
        requestId: (req as any).requestId,
        error,
      });
      errorResponse(
        res,
        'Failed to get menu',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/menu/role/{roleId}:
   *   get:
   *     summary: Get menus for a specific role
   *     tags: [Menu]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roleId
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     responses:
   *       200:
   *         description: List of menus for the role
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Menu'
   *       500:
   *         description: Failed to get role menus
   */
  async getRoleMenus(req: Request, res: Response) {
    try {
      const { roleId } = req.params;
      const result = await service.getRoleMenus(
        roleId,
        (req as any).requestId,
        (req as any).user?.id,
      );

      logger.debug('✅ Role menus retrieved', {
        requestId: (req as any).requestId,
        roleId,
      });
      successResponse(res, result || []);
    } catch (error) {
      logger.error('❌ Failed to get role menus', {
        requestId: (req as any).requestId,
        roleId: req.params.roleId,
        error,
      });
      errorResponse(
        res,
        'Failed to get role menus',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/menu:
   *   post:
   *     summary: Create a new menu
   *     tags: [Menu]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MenuCreateInput'
   *     responses:
   *       201:
   *         description: Menu created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Menu'
   *       500:
   *         description: Failed to create menu
   */
  async createMenu(req: Request, res: Response) {
    try {
      const result = await service.createMenu(
        req.body,
        (req as any).requestId,
        (req as any).user?.id,
      );

      logger.debug('✅ Menu created successfully', {
        requestId: (req as any).requestId,
        menuId: result.id,
      });
      successResponse(res, result, 201);
    } catch (error) {
      logger.error('❌ Failed to create menu', {
        requestId: (req as any).requestId,
        error,
      });
      errorResponse(
        res,
        'Failed to create menu',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/menu/{id}:
   *   put:
   *     summary: Update a menu
   *     tags: [Menu]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Menu ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MenuUpdateInput'
   *     responses:
   *       200:
   *         description: Menu updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Menu'
   *       404:
   *         description: Menu not found
   *       500:
   *         description: Failed to update menu
   */
  async updateMenu(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await service.updateMenu(
        id,
        req.body,
        (req as any).requestId,
        (req as any).user?.id,
      );

      if (!result) {
        errorResponse(res, 'Menu not found', 404);
        return;
      }

      logger.debug('✅ Menu updated successfully', {
        requestId: (req as any).requestId,
        menuId: id,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error('❌ Failed to update menu', {
        requestId: (req as any).requestId,
        error,
      });
      errorResponse(
        res,
        'Failed to update menu',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/menu/{id}:
   *   delete:
   *     summary: Delete a menu (soft delete)
   *     tags: [Menu]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Menu ID
   *     responses:
   *       200:
   *         description: Menu deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       404:
   *         description: Menu not found
   *       500:
   *         description: Failed to delete menu
   */
  async deleteMenu(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await service.deleteMenu(
        id,
        (req as any).requestId,
        (req as any).user?.id,
      );

      if (!result) {
        errorResponse(res, 'Menu not found', 404);
        return;
      }

      logger.debug('✅ Menu deleted successfully', {
        requestId: (req as any).requestId,
        menuId: id,
      });
      successResponse(res, { message: 'Menu deleted successfully' });
    } catch (error) {
      logger.error('❌ Failed to delete menu', {
        requestId: (req as any).requestId,
        error,
      });
      errorResponse(
        res,
        'Failed to delete menu',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/menu/tree:
   *   get:
   *     summary: Get menu tree (hierarchical structure)
   *     tags: [Menu]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Hierarchical menu tree
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Menu'
   *       500:
   *         description: Failed to get menu tree
   */
  async getMenuTree(req: Request, res: Response) {
    try {
      const result = await service.getMenuTree(
        (req as any).requestId,
        (req as any).user?.id,
      );

      logger.debug('✅ Menu tree retrieved successfully', {
        requestId: (req as any).requestId,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error('❌ Failed to get menu tree', {
        requestId: (req as any).requestId,
        error,
      });
      errorResponse(
        res,
        'Failed to get menu tree',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/cache/clear:
   *   post:
   *     summary: Clear menu cache
   *     tags: [Menu]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Menu cache cleared successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       500:
   *         description: Failed to clear menu cache
   */
  async clearMenuCache(req: Request, res: Response) {
    try {
      await service.clearMenuCache(
        (req as any).requestId,
        (req as any).user?.id,
      );

      logger.debug('✅ Menu cache cleared successfully', {
        requestId: (req as any).requestId,
      });
      successResponse(res, { message: 'Menu cache cleared successfully' });
    } catch (error) {
      logger.error('❌ Failed to clear menu cache', {
        requestId: (req as any).requestId,
        error,
      });
      errorResponse(
        res,
        'Failed to clear menu cache',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/menu/user/{userId}:
   *   get:
   *     summary: Get menus for a specific user
   *     tags: [Menu]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: List of menus for the user
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Menu'
   *       500:
   *         description: Failed to get user menus
   */
  // async getUserMenus(req: Request, res: Response) {
  //   try {
  //     const { userId } = req.params;
  //     const result = await service.getUserMenus(
  //       userId,
  //       (req as any).requestId,
  //       (req as any).user?.id,
  //     );

  //     logger.debug('✅ User menus retrieved successfully', {
  //       requestId: (req as any).requestId,
  //       userId,
  //     });
  //     successResponse(res, result);
  //   } catch (error) {
  //     logger.error('❌ Failed to get user menus', {
  //       requestId: (req as any).requestId,
  //       userId: req.params.userId,
  //       error,
  //     });
  //     errorResponse(
  //       res,
  //       'Failed to get user menus',
  //       500,
  //       process.env.NODE_ENV === 'development' ? String(error) : undefined,
  //     );
  //   }
  // },
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Menu:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique menu ID
 *         menuName:
 *           type: string
 *           description: Name of the menu
 *         path:
 *           type: string
 *           description: URL path for the menu
 *         menuIcon:
 *           type: string
 *           nullable: true
 *           description: Icon for the menu
 *         layout:
 *           type: string
 *           description: Layout type for the menu
 *         displayOrdinal:
 *           type: number
 *           description: Display order of the menu
 *         isActive:
 *           type: boolean
 *           description: Whether the menu is active
 *         childOf:
 *           type: string
 *           nullable: true
 *           description: Parent menu ID (if any)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         createdBy:
 *           type: string
 *           description: ID of the user who created the menu
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         updatedBy:
 *           type: string
 *           description: ID of the user who last updated the menu
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Menu'
 *           description: Child menus (for hierarchical structure)
 *       required:
 *         - id
 *         - menuName
 *         - path
 *         - layout
 *         - displayOrdinal
 *         - isActive
 *     MenuCreateInput:
 *       type: object
 *       properties:
 *         menuName:
 *           type: string
 *           description: Name of the menu
 *         path:
 *           type: string
 *           description: URL path for the menu
 *         menuIcon:
 *           type: string
 *           nullable: true
 *           description: Icon for the menu
 *         layout:
 *           type: string
 *           description: Layout type for the menu
 *         displayOrdinal:
 *           type: number
 *           description: Display order of the menu
 *         isActive:
 *           type: boolean
 *           description: Whether the menu is active
 *         childOf:
 *           type: string
 *           nullable: true
 *           description: Parent menu ID (if any)
 *       required:
 *         - menuName
 *         - path
 *         - layout
 *         - displayOrdinal
 *         - isActive
 *     MenuUpdateInput:
 *       type: object
 *       properties:
 *         menuName:
 *           type: string
 *           description: Name of the menu
 *         path:
 *           type: string
 *           description: URL path for the menu
 *         menuIcon:
 *           type: string
 *           nullable: true
 *           description: Icon for the menu
 *         layout:
 *           type: string
 *           description: Layout type for the menu
 *         displayOrdinal:
 *           type: number
 *           description: Display order of the menu
 *         isActive:
 *           type: boolean
 *           description: Whether the menu is active
 *         childOf:
 *           type: string
 *           nullable: true
 *           description: Parent menu ID (if any)
 */
