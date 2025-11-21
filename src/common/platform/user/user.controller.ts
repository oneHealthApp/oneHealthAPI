import { Request, Response } from 'express';
import { UserService } from './user.service';
import {
  successResponse,
  errorResponse,
  getModuleLogger,
  PaginationInput,
} from '../../../utils';
import { SmsService } from '../../../utils/smsService';

const logger = getModuleLogger('user-controller');

interface StructuredError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

/**
 * Controller layer for User operations.
 */
export const UserController = {
  /**
   * @swagger
   * /platform/o/user:
   *   post:
   *     summary: Create a new user
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserCreateInput'
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       500:
   *         description: Failed to create user
   */
  async create(req: Request, res: Response) {
    try {
      const result = await UserService.create(
        req.body,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ User created:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 201);
    } catch (error) {
      logger.error('❌ create User error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        'Failed to create user',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/o/user:
   *   get:
   *     summary: Get all users
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of all users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   *       500:
   *         description: Failed to fetch users
   */
  async getAll(req: Request, res: Response) {
    try {
      const result = await UserService.getAll(
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ all users retrieved:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ get all users error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        'Failed to fetch users',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/o/user/page:
   *   get:
   *     summary: Get paginated list of users
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 10
   *         description: Number of items per page
   *       - in: query
   *         name: filters
   *         schema:
   *           type: object
   *         description: Additional filters (optional)
   *     responses:
   *       200:
   *         description: Paginated list of users
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/User'
   *                 total:
   *                   type: number
   *                 currentPage:
   *                   type: number
   *                 pageSize:
   *                   type: number
   *                 totalPages:
   *                   type: number
   *       401:
   *         description: Missing or invalid JWT token
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: Unauthorized
   *       500:
   *         description: Failed to fetch paginated users
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: Failed to fetch paginated users
   */
  async getAllPaginated(req: Request, res: Response) {
    try {
      const pagination: PaginationInput = req.body?.pagination || {
        page: 1,
        limit: 10,
      };
      const result = await UserService.getPaginated(
        pagination,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ paginated users retrieved:', {
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
        'Failed to fetch paginated users',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/o/user/{id}:
   *   get:
   *     summary: Get user by ID
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         description: User not found
   *       500:
   *         description: Failed to fetch user
   */
  async getById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await UserService.get(
        id,
        (req as any).requestId,
        (req as any).user?.id,
      );
      if (!result) {
        errorResponse(res, 'User not found', 404);
        return;
      }
      logger.debug('✅ User retrieved by ID:', {
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
        'Failed to fetch user',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/o/user/{id}:
   *   put:
   *     summary: Update a user
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserUpdateInput'
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         description: User not found
   *       500:
   *         description: Failed to update user
   */
  async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await UserService.update(
        id,
        req.body,
        (req as any).requestId,
        (req as any).user?.id,
      );
      if (!result) {
        errorResponse(res, 'User not found', 404);
        return;
      }
      logger.debug('✅ User updated:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ update User error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        'Failed to update user',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/o/user/{id}:
   *   delete:
   *     summary: Delete a user (soft delete via lock)
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         description: User not found
   *       500:
   *         description: Failed to delete user
   */
  async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await UserService.delete(
        id,
        (req as any).requestId,
        (req as any).user?.id,
      );
      if (!result) {
        errorResponse(res, 'User not found', 404);
        return;
      }
      logger.debug('✅ User deleted:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ delete User error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        'Failed to delete user',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/o/user/reg:
   *   post:
   *     summary: Register a new user
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserCreateInput'
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       400:
   *         description: User, email, or mobile number already in use
   *       500:
   *         description: Failed to register user
   */
  async register(req: Request, res: Response) {
    try {
      const result = await UserService.register(
        req.body,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ User registered:', {
        requestId: (req as any).requestId,
        result,
      });
      successResponse(res, result, 201);
    } catch (error: any) {
      logger.error('❌ register User error:', {
        requestId: (req as any).requestId,
        error,
      });
      const status =
        error.message.includes('already in use') ||
        error.message.includes('already exists')
          ? 400
          : 500;
      errorResponse(res, 'Failed to register user', status, String(error));
    }
  },

  /**
   * @swagger
   * /platform/r/user/lock:
   *   post:
   *     summary: Lock a user account
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               id:
   *                 type: string
   *                 description: User ID to lock
   *             required:
   *               - id
   *     responses:
   *       200:
   *         description: User locked successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       400:
   *         description: User already locked
   *       404:
   *         description: User not found
   *       500:
   *         description: Failed to lock user
   */
  async lockAccount(req: Request, res: Response) {
    try {
      const result = await UserService.lockUser(
        req.body.id,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ User locked:', {
        requestId: (req as any).requestId,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ lock user error:', {
        requestId: (req as any).requestId,
        error,
      });
      errorResponse(res, 'Failed to lock user', 500, String(error));
    }
  },

  /**
   * @swagger
   * /platform/r/user/unlock:
   *   post:
   *     summary: Unlock a user account
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               id:
   *                 type: string
   *                 description: User ID to unlock
   *             required:
   *               - id
   *     responses:
   *       200:
   *         description: User unlocked successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       400:
   *         description: User already unlocked
   *       404:
   *         description: User not found
   *       500:
   *         description: Failed to unlock user
   */
  async unlockAccount(req: Request, res: Response) {
    try {
      const result = await UserService.unlockUser(
        req.body.id,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ User unlocked:', {
        requestId: (req as any).requestId,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ unlock user error:', {
        requestId: (req as any).requestId,
        error,
      });
      errorResponse(res, 'Failed to unlock user', 500, String(error));
    }
  },

  /**
   * @swagger
   * /platform/r/user/profile:
   *   get:
   *     summary: Get logged-in user's profile
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: User not authenticated
   *       404:
   *         description: User not found
   *       500:
   *         description: Failed to fetch profile
   */
  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        logger.warn('User ID not found in request');
        errorResponse(res, 'Unauthorized: User not authenticated', 401);
        return; // Early return after sending response
      }

      const result = await UserService.getProfile(userId);
      if (!result) {
        errorResponse(res, 'User not found', 404);
        return; // Early return after sending response
      }

      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ get profile error:', { error });
      errorResponse(res, 'Failed to fetch profile', 500, String(error));
    }
  },

  /**
   * @swagger
   * /platform/r/user/confirm/email:
   *   post:
   *     summary: Confirm user email with token
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               token:
   *                 type: string
   *                 description: Email confirmation token
   *             required:
   *               - token
   *     responses:
   *       200:
   *         description: Email confirmed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid or expired token
   *       500:
   *         description: Failed to confirm email
   */
  async confirmEmail(req: Request, res: Response) {
    try {
      await UserService.confirmEmail(req.body.token);
      successResponse(res, { message: 'Email confirmed successfully' }, 200);
    } catch (error: any) {
      logger.error('❌ confirm email error:', { error });
      errorResponse(
        res,
        'Failed to confirm email',
        error.status || 400,
        error.message || String(error),
      );
    }
  },

  /**
   * @swagger
   * /platform/r/user/confirm/mobile:
   *   post:
   *     summary: Confirm user mobile number with OTP
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               identifier:
   *                 type: string
   *                 description: User ID
   *               otp:
   *                 type: string
   *                 description: One-time password
   *             required:
   *               - identifier
   *               - otp
   *     responses:
   *       200:
   *         description: Mobile confirmed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid OTP or user already validated
   *       404:
   *         description: User not found
   *       500:
   *         description: Failed to confirm mobile
   */
  async confirmMobile(req: Request, res: Response) {
    try {
      await UserService.confirmMobile(req.body.identifier, req.body.otp);
      successResponse(res, { message: 'Mobile confirmed successfully' }, 200);
    } catch (error: any) {
      logger.error('❌ confirm mobile error:', { error });
      errorResponse(
        res,
        'Failed to confirm mobile',
        error.status || 400,
        error.message || String(error),
      );
    }
  },

  /**
   * @swagger
   * /platform/o/user/role/attach:
   *   post:
   *     summary: Attach roles to a user
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *                 description: User ID
   *               roleIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of role IDs to attach
   *             required:
   *               - userId
   *               - roleIds
   *     responses:
   *       200:
   *         description: Roles attached successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 count:
   *                   type: number
   *                   description: Number of roles attached
   *       400:
   *         description: Invalid input or roles already assigned
   *       404:
   *         description: User or roles not found
   *       500:
   *         description: Failed to attach roles
   */
  async attachRoles(req: Request, res: Response) {
    try {
      const result = await UserService.attachRoles(
        req.body.userId,
        req.body.roleIds,
        (req as any).requestId,
      );
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ attach roles error:', { error });
      errorResponse(res, 'Failed to attach roles', 500, String(error));
    }
  },

  /**
   * @swagger
   * /platform/o/user/role/detach:
   *   post:
   *     summary: Detach roles from a user
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *                 description: User ID
   *               roleIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of role IDs to detach
   *             required:
   *               - userId
   *               - roleIds
   *     responses:
   *       200:
   *         description: Roles detached successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 count:
   *                   type: number
   *                   description: Number of roles detached
   *       400:
   *         description: Invalid input or roles not assigned
   *       404:
   *         description: User not found
   *       500:
   *         description: Failed to detach roles
   */
  async detachRoles(req: Request, res: Response) {
    try {
      const result = await UserService.detachRoles(
        req.body.userId,
        req.body.roleIds,
        (req as any).requestId,
      );
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ detach roles error:', { error });
      errorResponse(res, 'Failed to detach roles', 500, String(error));
    }
  },

  /**
   * @swagger
   * /platform/o/user/{id}/roles:
   *   get:
   *     summary: Get all roles attached to a user
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: List of user roles
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/UserRole'
   *       500:
   *         description: Failed to fetch user roles
   */
  async getUserRoles(req: Request, res: Response) {
    try {
      const result = await UserService.getUserRoles(req.params.id);
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ get user roles error:', { error });
      errorResponse(res, 'Failed to fetch user roles', 500, String(error));
    }
  },

  /**
   * @swagger
   * /platform/user/filtered:
   *   get:
   *     summary: List users filtered by lock status
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: isLocked
   *         schema:
   *           type: boolean
   *         description: Filter users by lock status (true/false)
   *     responses:
   *       200:
   *         description: Filtered list of users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   *       500:
   *         description: Failed to fetch filtered users
   */
  async listFiltered(req: Request, res: Response) {
    try {
      const { isLocked } = req.query;
      const activeBool: boolean =
        isLocked === 'true' ? true : isLocked === 'false' ? false : false;
      const result = await UserService.listFiltered(
        activeBool,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ Filtered roles retrieved:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        isLocked,
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
   * /platform/o/user/cache/clear/{id}:
   *   post:
   *     summary: Clear user cache by ID
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User cache cleared successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       500:
   *         description: Failed to clear user cache
   */
  async clearCacheById(req: Request, res: Response) {
    try {
      const result = await UserService.clearCache(req.params.id);
      successResponse(res, { message: 'User cache cleared successfully' }, 200);
    } catch (error) {
      logger.error('❌ clear user cache error:', { error });
      errorResponse(res, 'Failed to clear user cache', 500, String(error));
    }
  },

  /**
   * @swagger
   * /platform/o/user/{id}:
   *   get:
   *     summary: Get full user details by ID
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: Full user details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/FullUser'
   *       404:
   *         description: User not found
   *       500:
   *         description: Failed to fetch user
   */
  async getFullById(req: Request, res: Response) {
    try {
      const result = await UserService.getFullById(req.params.id);
      if (!result) {
        errorResponse(res, 'User not found', 404);
        return;
      }
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ get full user by ID error:', { error });
      errorResponse(res, 'Failed to fetch user', 500, String(error));
    }
  },

  /**
   * @swagger
   * /platform/o/user/with-person-roles:
   *   post:
   *     summary: Create user with person details and roles
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateUserWithPersonRequest'
   *     responses:
   *       201:
   *         description: User created successfully
   *       409:
   *         description: Identifier conflict (email, mobile, or userId already in use)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: Email 'test@example.com' is already in use, Mobile number '1234567890' is already in use
   *       500:
   *         description: Server error
   */
  async createUserWithPersonAndRoles(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { person, user, roles } = req.body;

      logger.debug('Creating user with person and roles', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        input: { person, user, roles },
      });

      const result = await UserService.createUserWithPersonAndRoles(
        person,
        user,
        roles,
        (req as any).requestId,
        (req as any).user?.id || user.createdBy,
      );

      if (!result) {
        logger.error('User creation failed - result is null', {
          requestId: (req as any).requestId,
          userId: (req as any).user?.id,
          input: { person, user, roles },
        });
        errorResponse(res, 'User creation failed', 500);
        return;
      }

      logger.debug('✅ User with person and roles created:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result: { id: result.id, userId: result.userId },
      });

      successResponse(res, result, 201);
    } catch (error: any) {
      logger.error('❌ createUserWithPersonAndRoles error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error: error.message,
      });

      let statusCode = 500;
      let errorResponse: StructuredError = {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create user',
      };

      // Handle identifier conflict errors
      if (
        error.message.includes('already in use') ||
        error.message.includes('already registered')
      ) {
        statusCode = 409;

        if (
          error.message.includes('email') ||
          error.message.includes('Email')
        ) {
          errorResponse = {
            code: 'EMAIL_CONFLICT',
            message: error.message,
            field: 'email',
          };
        } else if (
          error.message.includes('mobile') ||
          error.message.includes('Mobile')
        ) {
          errorResponse = {
            code: 'MOBILE_CONFLICT',
            message: error.message,
            field: 'mobile',
          };
        } else if (
          error.message.includes('user id') ||
          error.message.includes('User ID')
        ) {
          errorResponse = {
            code: 'USERID_CONFLICT',
            message: error.message,
            field: 'userId',
          };
        } else {
          errorResponse = {
            code: 'CONFLICT_ERROR',
            message: error.message,
          };
        }
      } else if (error.message.includes('not found')) {
        statusCode = 404;
        errorResponse = {
          code: 'NOT_FOUND',
          message: error.message,
        };
      } else if (error.message.includes('validation')) {
        statusCode = 400;
        errorResponse = {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.details, // If available from Joi
        };
      }

      res.status(statusCode).json({
        success: false,
        error: errorResponse,
        message: errorResponse.message,
        statusCode,
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        requestId: (req as any).requestId,
      });
    }
  },
  // user.controller.ts - Add this method
  /**
   * @swagger
   * /platform/o/user/role/{roleName}:
   *   get:
   *     summary: Get users by role name
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roleName
   *         required: true
   *         schema:
   *           type: string
   *         description: Role name to filter by
   *     responses:
   *       200:
   *         description: List of users with the specified role
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   *       500:
   *         description: Failed to fetch users by role
   */
  async getUsersByRole(req: Request, res: Response) {
    try {
      const roleName = String(req.params.roleName);
      const result = await UserService.getUsersByRole(
        roleName,
        (req as any).requestId,
        (req as any).user?.id,
      );

      logger.debug('✅ Users by role retrieved:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        roleName,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ get users by role error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        'Failed to fetch users by role',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  // Add to user.controller.ts
  /**
   * @swagger
   * /platform/r/user/profile:
   *   put:
   *     summary: Update logged-in user's profile
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               person:
   *                 type: object
   *                 properties:
   *                   nameInEnglish:
   *                     type: string
   *                   gender:
   *                     type: string
   *                     enum: [Male, Female, Other]
   *                   dateOfBirth:
   *                     type: string
   *                     format: date
   *                   mobile:
   *                     type: string
   *                   email:
   *                     type: string
   *                     format: email
   *               profilePictureUrl:
   *                 type: string
   *                 format: uri
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/FullUser'
   *       500:
   *         description: Failed to update profile
   */
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = req.body;
      const result = await UserService.updateProfile(
        userId,
        data,
        (req as any).requestId,
        userId,
      );
      logger.debug('✅ Profile updated:', {
        requestId: (req as any).requestId,
        userId,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ update Profile error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        'Failed to update profile',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/o/user/with-person-roles/{id}:
   *   put:
   *     summary: Update user with person details and roles
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateUserWithPersonRequest'
   *     responses:
   *       200:
   *         description: User updated successfully
   *       409:
   *         description: Identifier conflict (email, mobile, or userId already in use)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: Email 'test@example.com' is already in use
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
  async updateUserWithPersonAndRoles(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { person, user, roles } = req.body;

      logger.debug('Updating user with person and roles', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        targetUserId: id,
        input: { person, user, roles },
      });

      const result = await UserService.updateUserWithPersonAndRoles(
        id,
        person,
        user,
        roles,
        (req as any).requestId,
        (req as any).user?.id || user.updatedBy,
      );

      if (!result) {
        logger.error('User update failed - result is null', {
          requestId: (req as any).requestId,
          userId: (req as any).user?.id,
          targetUserId: id,
          input: { person, user, roles },
        });
        errorResponse(res, 'User update failed', 500);
        return;
      }

      logger.debug('✅ User with person and roles updated:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result: { id: result.id, userId: result.userId },
      });

      successResponse(res, result, 200);
    } catch (error: any) {
      logger.error('❌ updateUserWithPersonAndRoles error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error: error.message,
      });

      // Handle identifier conflict errors
      if (
        error.message.includes('already in use') ||
        error.message.includes('already registered')
      ) {
        errorResponse(res, error.message, 409);
        return;
      }

      // Handle not found errors
      if (error.message.includes('not found')) {
        errorResponse(res, error.message, 404);
        return;
      }

      // Handle other errors
      const statusCode = error.statusCode || 400;
      errorResponse(
        res,
        error.message || 'Failed to update user with person and roles',
        statusCode,
      );
    }
  },

  // user.controller.ts - Add this method
  /**
   * @swagger
   * /platform/o/user/full/{id}:
   *   get:
   *     summary: Get full user details with all relations
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: Full user details with all relations
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/FullUser'
   *       404:
   *         description: User not found
   *       500:
   *         description: Failed to fetch user
   */
  async getFullUserById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await UserService.getFullById(id);

      if (!result) {
        errorResponse(res, 'User not found', 404);
        return;
      }

      logger.debug('✅ Full user retrieved by ID:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result: { id: result.id, userId: result.userId },
      });

      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ get full user by ID error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(res, 'Failed to fetch user', 500, String(error));
    }
  },

  // user.controller.ts - ADD THIS METHOD
  /**
   * @swagger
   * /platform/o/user/role-id/{roleId}:
   *   get:
   *     summary: Get users by role ID
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roleId
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID to filter by
   *     responses:
   *       200:
   *         description: List of users with the specified role ID
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   *       500:
   *         description: Failed to fetch users by role ID
   */
  async getUsersByRoleId(req: Request, res: Response) {
    try {
      const roleId = String(req.params.roleId);
      const result = await UserService.getUsersByRoleId(
        roleId,
        (req as any).requestId,
        (req as any).user?.id,
      );

      logger.debug('✅ Users by role ID retrieved:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        roleId,
        result,
      });
      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ get users by role ID error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        'Failed to fetch users by role ID',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  /**
   * @swagger
   * /platform/r/user/send-password-sms:
   *   post:
   *     summary: Send password via SMS
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               mobile:
   *                 type: string
   *                 description: Mobile number to send SMS to
   *               password:
   *                 type: string
   *                 description: Password to send
   *               purpose:
   *                 type: string
   *                 enum: [user_creation, password_reset]
   *                 description: Purpose of the SMS
   *             required:
   *               - mobile
   *               - password
   *               - purpose
   *     responses:
   *       200:
   *         description: SMS sent successfully
   *       500:
   *         description: Failed to send SMS
   */
  async sendPasswordSms(req: Request, res: Response) {
    try {
      const { mobile, password, purpose } = req.body;

      // Use your existing SMS service
      await SmsService.sendOtpSms(
        mobile,
        password,
        purpose === 'user_creation' ? 'user_creation' : 'password_reset',
      );

      logger.debug('✅ Password SMS sent successfully:', {
        mobile,
        purpose,
        requestId: (req as any).requestId,
      });

      successResponse(res, { message: 'SMS sent successfully' }, 200);
    } catch (error) {
      logger.error('❌ send password SMS error:', {
        error,
        requestId: (req as any).requestId,
      });
      errorResponse(res, 'Failed to send SMS', 500, String(error));
    }
  },
};

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique user ID
 *         userId:
 *           type: string
 *           description: Unique user identifier
 *         emailId:
 *           type: string
 *           description: User's email address
 *         mobileNumber:
 *           type: string
 *           description: User's mobile number
 *         emailValidationStatus:
 *           type: boolean
 *           description: Whether the email is validated
 *         mobileValidationStatus:
 *           type: boolean
 *           description: Whether the mobile number is validated
 *         profilePictureUrl:
 *           type: string
 *           nullable: true
 *           description: URL of the user's profile picture
 *         isLocked:
 *           type: boolean
 *           description: Whether the user account is locked
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       required:
 *         - id
 *         - userId
 *         - emailId
 *         - mobileNumber
 *         - emailValidationStatus
 *         - mobileValidationStatus
 *         - isLocked
 *     FullUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique user ID
 *         userId:
 *           type: string
 *           description: Unique user identifier
 *         emailId:
 *           type: string
 *           description: User's email address
 *         mobileNumber:
 *           type: string
 *           description: User's mobile number
 *         emailValidationStatus:
 *           type: boolean
 *           description: Whether the email is validated
 *         mobileValidationStatus:
 *           type: boolean
 *           description: Whether the mobile number is validated
 *         profilePictureUrl:
 *           type: string
 *           nullable: true
 *           description: URL of the user's profile picture
 *         isLocked:
 *           type: boolean
 *           description: Whether the user account is locked
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         person:
 *           type: object
 *           description: Associated person details
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *         UserRole:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserRole'
 *       required:
 *         - id
 *         - userId
 *         - emailId
 *         - mobileNumber
 *         - emailValidationStatus
 *         - mobileValidationStatus
 *         - isLocked
 *     UserCreateInput:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: Unique user identifier
 *         emailId:
 *           type: string
 *           description: User's email address
 *         mobileNumber:
 *           type: string
 *           description: User's mobile number
 *         password:
 *           type: string
 *           description: User's password
 *         profilePictureUrl:
 *           type: string
 *           nullable: true
 *           description: URL of the user's profile picture
 *       required:
 *         - userId
 *         - emailId
 *         - mobileNumber
 *         - password
 *     UserUpdateInput:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: Unique user identifier
 *         emailId:
 *           type: string
 *           description: User's email address
 *         mobileNumber:
 *           type: string
 *           description: User's mobile number
 *         password:
 *           type: string
 *           description: User's new password
 *         profilePictureUrl:
 *           type: string
 *           nullable: true
 *           description: URL of the user's profile picture
 *         emailValidationStatus:
 *           type: boolean
 *           description: Whether the email is validated
 *         mobileValidationStatus:
 *           type: boolean
 *           description: Whether the mobile number is validated
 *         isLocked:
 *           type: boolean
 *           description: Whether the user account is locked
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
 *     UserRole:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: User ID
 *         roleId:
 *           type: string
 *           description: Role ID
 *         priority:
 *           type: number
 *           description: Role priority
 *         createdBy:
 *           type: string
 *           description: ID of the user who assigned the role
 *         updatedBy:
 *           type: string
 *           description: ID of the user who last updated the role
 *         role:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             roleName:
 *               type: string
 *             isActive:
 *               type: boolean
 *       required:
 *         - userId
 *         - roleId
 *         - priority
 */
