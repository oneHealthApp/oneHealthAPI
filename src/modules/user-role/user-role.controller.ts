import { Request, Response } from 'express';
import { UserRoleService } from './user-role.service';
import {
  successResponse,
  errorResponse,
  getModuleLogger,
  PaginationInput,
} from '../../utils';

const logger = getModuleLogger('user-role-controller');

/**
 * Controller layer for UserRole operations.
 */
export const UserRoleController = {
  async create(req: Request, res: Response) {
    try {
      const result = await UserRoleService.create(
        req.body,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ UserRole created:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 201);
    } catch (error) {
      logger.error('❌ create UserRole error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to create userRole',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },
  async bulkCreate(req: Request, res: Response) {
    try {
      const result = await UserRoleService.bulkCreate(
        req.body,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ UserRole created:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 201);
    } catch (error) {
      logger.error('❌ create UserRole error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to create userRole',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const result = await UserRoleService.getAll(
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ all userRoles retrieved:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error('❌ get all userRoles error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to fetch userRoles',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async getAllPaginated(req: Request, res: Response) {
    try {
      const pagination: PaginationInput = req.body?.pagination || {
        page: 1,
        limit: 10,
      };
      const result = await UserRoleService.getPaginated(
        pagination,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ paginated userRoles retrieved:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        pagination,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error('❌ paginated fetch error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to fetch paginated userRoles',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await UserRoleService.get(
        id,
        (req as any).requestId,
        (req as any).user?.id,
      );
      if (!result) {
        errorResponse(res, 'UserRole not found', 404);
        return;
      }
      logger.debug('✅ UserRole retrieved by ID:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error('❌ get by ID error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to fetch userRole',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },
  async getByUserId(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await UserRoleService.getByUserId(
        id,
        (req as any).requestId,
        (req as any).user?.id,
      );
      if (!result) {
        errorResponse(res, 'UserRole not found', 404);
        return;
      }
      logger.debug('✅ UserRole retrieved by user ID:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error('❌ get by user ID error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to fetch userRole',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await UserRoleService.update(
        id,
        req.body,
        (req as any).requestId,
        (req as any).user?.id,
      );
      if (!result) {
        errorResponse(res, 'UserRole not found', 404);
        return;
      }
      logger.debug('✅ UserRole updated:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error('❌ update UserRole error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to update userRole',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await UserRoleService.delete(
        id,
        (req as any).requestId,
        (req as any).user?.id,
      );
      if (!result) {
        errorResponse(res, 'UserRole not found', 404);
        return;
      }
      logger.debug('✅ UserRole deleted:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error('❌ delete UserRole error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to delete userRole',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async deleteByUserIdAndRoleId(req: Request, res: Response) {
    try {
      const userId = String(req.params.userid);
      const roleId = String(req.params.roleid);
      const result = await UserRoleService.deleteByUserIdAndRoleId(
        userId,
        roleId,
        (req as any).requestId,
        (req as any).user?.id,
      );
      if (!result) {
        errorResponse(res, 'UserRole not found', 404);
        return;
      }
      logger.debug('✅ UserRole deleted by user ID and role ID:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error('❌ delete by user ID and role ID error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to delete userRole',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },
};
