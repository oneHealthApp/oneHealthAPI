import { Request, Response } from "express";
import { RoleService } from "./role.service";
import { successResponse, errorResponse, getModuleLogger, PaginationInput } from "../../utils";

const logger = getModuleLogger("role-controller");

/**
 * Controller layer for Role operations.
 * 
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Role ID
 *         name:
 *           type: string
 *           description: Role name
 *         displayName:
 *           type: string
 *           description: Role display name
 *         description:
 *           type: string
 *           description: Role description
 *         isActive:
 *           type: boolean
 *           description: Role active status
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     RoleCreate:
 *       type: object
 *       required:
 *         - name
 *         - displayName
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *         displayName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 500
 *         isActive:
 *           type: boolean
 *           default: true
 *   tags:
 *     - name: Roles
 *       description: Role management operations
 */
export const RoleController = {
  /**
   * @swagger
   * /roles:
   *   post:
   *     tags: [Roles]
   *     summary: Create a new role
   *     description: Creates a new role in the system
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RoleCreate'
   *     responses:
   *       201:
   *         description: Role created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Role'
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  async create(req: Request, res: Response) {
    try {
      const result = await RoleService.create(
        req.body,
        (req as any).requestId,
        (req as any).user?.id
      );
      logger.debug("✅ Role created:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 201);
    } catch (error) {
      logger.error("❌ create Role error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        "Failed to create role",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const result = await RoleService.getAll(
        (req as any).requestId,
        (req as any).user?.id
      );
      logger.debug("✅ all roles retrieved:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ get all roles error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        "Failed to fetch roles",
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
      const result = await RoleService.getPaginated(
        pagination,
        (req as any).requestId,
        (req as any).user?.id
      );
      logger.debug("✅ paginated roles retrieved:", {
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
        "Failed to fetch paginated roles",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await RoleService.get(
        id,
        (req as any).requestId,
        (req as any).user?.id
      );
      if (!result) {
        errorResponse(res, "Role not found", 404);
        return;
      }
      logger.debug("✅ Role retrieved by ID:", {
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
        "Failed to fetch role",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await RoleService.update(
        id,
        req.body,
        (req as any).requestId,
        (req as any).user?.id
      );
      if (!result) {
        errorResponse(res, "Role not found", 404);
        return;
      }
      logger.debug("✅ Role updated:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ update Role error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        "Failed to update role",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await RoleService.delete(
        id,
        (req as any).requestId,
        (req as any).user?.id
      );
      if (!result) {
        errorResponse(res, "Role not found", 404);
        return;
      }
      logger.debug("✅ Role deleted:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ delete Role error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        "Failed to delete role",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },
};