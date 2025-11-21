import { Request, Response } from "express";
import { MenuService } from "./menu.service";
import { successResponse, errorResponse, getModuleLogger, PaginationInput } from "../../utils";

const logger = getModuleLogger("menu-controller");

/**
 * Controller layer for Menu operations.
 * 
 * @swagger
 * components:
 *   schemas:
 *     Menu:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Menu ID
 *         parentId:
 *           type: string
 *           nullable: true
 *           description: Parent menu ID (null for top-level menus)
 *         name:
 *           type: string
 *           description: Menu name
 *         slug:
 *           type: string
 *           description: Menu slug for URL
 *         path:
 *           type: string
 *           description: Menu path/route
 *         icon:
 *           type: string
 *           description: Menu icon class or name
 *         order:
 *           type: integer
 *           description: Display order
 *         isActive:
 *           type: boolean
 *           description: Menu active status
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     MenuCreate:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *         - path
 *       properties:
 *         parentId:
 *           type: string
 *           nullable: true
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *         slug:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *         path:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         icon:
 *           type: string
 *           maxLength: 50
 *         order:
 *           type: integer
 *           minimum: 0
 *         isActive:
 *           type: boolean
 *           default: true
 *   tags:
 *     - name: Menus
 *       description: Menu management operations
 */
export const MenuController = {
  /**
   * @swagger
   * /menus:
   *   post:
   *     tags: [Menus]
   *     summary: Create a new menu
   *     description: Creates a new menu item in the system
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MenuCreate'
   *     responses:
   *       201:
   *         description: Menu created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Menu'
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  async create(req: Request, res: Response) {
    try {
      const result = await MenuService.create(
        req.body,
        (req as any).requestId,
        (req as any).user?.id
      );
      logger.debug("✅ Menu created:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 201);
    } catch (error) {
      logger.error("❌ create Menu error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        "Failed to create menu",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /menus:
   *   get:
   *     tags: [Menus]
   *     summary: Get all menus
   *     description: Retrieves all menu items
   *     responses:
   *       200:
   *         description: Menus retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Menu'
   */
  async getAll(req: Request, res: Response) {
    try {
      const result = await MenuService.getAll(
        (req as any).requestId,
        (req as any).user?.id
      );
      logger.debug("✅ all menus retrieved:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ get all menus error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        "Failed to fetch menus",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  async getAllPaginated(req: Request, res: Response) {
    try {
      const pagination: PaginationInput = req.body?.pagination || {
        page: 1,
        limit: 10,
      };
      const result = await MenuService.getPaginated(
        pagination,
        (req as any).requestId,
        (req as any).user?.id
      );
      logger.debug("✅ paginated menus retrieved:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        pagination,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ paginated fetch error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        "Failed to fetch paginated menus",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await MenuService.get(
        id,
        (req as any).requestId,
        (req as any).user?.id
      );
      if (!result) {
        errorResponse(res, "Menu not found", 404);
        return;
      }
      logger.debug("✅ Menu retrieved by ID:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ get by ID error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        "Failed to fetch menu",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await MenuService.update(
        id,
        req.body,
        (req as any).requestId,
        (req as any).user?.id
      );
      if (!result) {
        errorResponse(res, "Menu not found", 404);
        return;
      }
      logger.debug("✅ Menu updated:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ update Menu error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        "Failed to update menu",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await MenuService.delete(
        id,
        (req as any).requestId,
        (req as any).user?.id
      );
      if (!result) {
        errorResponse(res, "Menu not found", 404);
        return;
      }
      logger.debug("✅ Menu deleted:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ delete Menu error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        "Failed to delete menu",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  async getByUserId(req: Request, res: Response) {
    try {
        const userId = String(req.params.userId);
        const result = await MenuService.getByUserId(
            userId,
            (req as any).requestId,
            (req as any).user?.id
        );
        
        logger.debug("✅ User menus retrieved:", {
            requestId: (req as any).requestId,
            requestingUserId: (req as any).user?.id,
            targetUserId: userId,
        });
        
        successResponse(res, result);
    } catch (error) {
        logger.error("❌ Failed to get user menus:", {
            requestId: (req as any).requestId,
            userId: req.params.userId,
            error,
        });
        errorResponse(
            res,
            "Failed to fetch user menus",
            500,
            process.env.NODE_ENV === "development" ? String(error) : undefined
        );
    }
}
};