import { Request, Response } from 'express';
import { RoleMenuAccessService } from './role-menu-access.service';
import {
  successResponse,
  errorResponse,
  getModuleLogger,
  PaginationInput,
} from '../../utils';

const logger = getModuleLogger('role-menu-access-controller');

/**
 * Controller layer for RoleMenuAccess operations.
 */
export const RoleMenuAccessController = {
  async create(req: Request, res: Response) {
    try {
      const result = await RoleMenuAccessService.create(
        req.body,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ RoleMenuAccess created:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 201);
    } catch (error) {
      logger.error('❌ create RoleMenuAccess error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to create roleMenuAccess',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },
  async bulkCreate(req: Request, res: Response) {
    try {
      const result = await RoleMenuAccessService.bulkCreate(
        req.body,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ RoleMenuAccess created:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 201);
    } catch (error) {
      logger.error('❌ create RoleMenuAccess error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to create roleMenuAccess',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const result = await RoleMenuAccessService.getAll(
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ all roleMenuAccesss retrieved:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error('❌ get all roleMenuAccesss error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to fetch roleMenuAccesss',
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
      const result = await RoleMenuAccessService.getPaginated(
        pagination,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ paginated roleMenuAccesss retrieved:', {
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
        error || 'Failed to fetch paginated roleMenuAccesss',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await RoleMenuAccessService.get(
        id,
        (req as any).requestId,
        (req as any).user?.id,
      );
      if (!result) {
        errorResponse(res, 'RoleMenuAccess not found', 404);
        return;
      }
      logger.debug('✅ RoleMenuAccess retrieved by ID:', {
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
        error || 'Failed to fetch roleMenuAccess',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },
  async getByRole(req: Request, res: Response) {
    try {
      const roleId = String(req.params.roleId);
      const result = await RoleMenuAccessService.getByRole(
        roleId,
        (req as any).requestId,
        (req as any).user?.id,
      );
      if (!result) {
        errorResponse(res, 'RoleMenuAccess not found', 404);
        return;
      }
      logger.debug('✅ RoleMenuAccess retrieved by ID:', {
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
        error || 'Failed to fetch roleMenuAccess',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await RoleMenuAccessService.update(
        id,
        req.body,
        (req as any).requestId,
        (req as any).user?.id,
      );
      if (!result) {
        errorResponse(res, 'RoleMenuAccess not found', 404);
        return;
      }
      logger.debug('✅ RoleMenuAccess updated:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error('❌ update RoleMenuAccess error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to update roleMenuAccess',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await RoleMenuAccessService.delete(
        id,
        (req as any).requestId,
        (req as any).user?.id,
      );
      if (!result) {
        errorResponse(res, 'RoleMenuAccess not found', 404);
        return;
      }
      logger.debug('✅ RoleMenuAccess deleted:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error('❌ delete RoleMenuAccess error:', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to delete roleMenuAccess',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },
};
