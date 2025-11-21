import { prisma } from '../../common';
import {
  RoleMenuAccessCreateInput,
  RoleMenuAccessCreateManyInput,
  RoleMenuAccessUpdateInput,
} from './role-menu-access.type';
import { getModuleLogger, PaginationInput } from '../../utils';
import { handlePrismaError } from '../../utils/prismaErrorHandler';

const logger = getModuleLogger('role-menu-access-repository');

/**
 * Repository layer for direct DB access (RoleMenuAccess entity).
 */
export const RoleMenuAccessRepository = {
  async create(
    data: RoleMenuAccessCreateInput,
    requestId: string,
    userId: string,
  ) {
    try {
      const result = await prisma.roleMenuAccess.create({ data });
      logger.debug('RoleMenuAccess created successfully', {
        data,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error creating RoleMenuAccess:', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async bulkCreate(
    data: RoleMenuAccessCreateManyInput[],
    requestId: string,
    userId: string,
  ) {
    try {
      const result = await prisma.roleMenuAccess.createMany({ data });
      logger.debug('Bulk RoleMenuAccess created successfully', {
        data,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error creating bulk RoleMenuAccess:', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async getAll(requestId: string, userId: string) {
    try {
      const result = await prisma.roleMenuAccess.findMany();
      logger.debug('Fetched all roleMenuAccesss successfully', {
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error fetching all roleMenuAccesss:', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async getPaginated(
    pagination: PaginationInput,
    requestId: string,
    userId: string,
  ) {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const [data, total] = await prisma.$transaction([
        prisma.roleMenuAccess.findMany({ skip, take: limit }),
        prisma.roleMenuAccess.count(),
      ]);

      logger.debug('Fetched paginated roleMenuAccesss successfully', {
        data,
        total,
        requestId,
        userId,
      });

      return {
        data,
        total,
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error fetching paginated roleMenuAccesss:', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string) {
    try {
      const result = await prisma.roleMenuAccess.findUnique({ where: { id } });
      logger.debug('Fetched RoleMenuAccess by ID successfully', {
        id,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error fetching RoleMenuAccess by ID:', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async getByRole(roleId: string, requestId: string, userId: string) {
    try {
      const result = await prisma.roleMenuAccess.findMany({
        where: { roleId },
        include: { menu: true },
      });
      logger.debug('Fetched RoleMenuAccess by role ID successfully', {
        roleId,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error fetching RoleMenuAccess by role ID:', {
        roleId,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async update(
    id: string,
    data: RoleMenuAccessUpdateInput,
    requestId: string,
    userId: string,
  ) {
    try {
      const result = await prisma.roleMenuAccess.update({
        where: { id },
        data,
      });
      logger.debug('Updated RoleMenuAccess successfully', {
        id,
        data,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error updating RoleMenuAccess with ID:', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async delete(id: string, requestId: string, userId: string) {
    try {
      const result = await prisma.roleMenuAccess.delete({ where: { id } });
      logger.debug('Deleted RoleMenuAccess successfully', {
        id,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error deleting RoleMenuAccess with ID:', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },
};
