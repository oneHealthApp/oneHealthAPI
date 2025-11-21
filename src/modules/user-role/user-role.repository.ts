import { prisma } from '../../common';
import {
  UserRoleCreateInput,
  UserRoleCreateManyInput,
  UserRoleUpdateInput,
} from './user-role.type';
import { getModuleLogger, PaginationInput } from '../../utils';

const logger = getModuleLogger('user-role-repository');

/**
 * Repository layer for direct DB access (UserRole entity).
 */
export const UserRoleRepository = {
  async create(data: UserRoleCreateInput, requestId: string, userId: string) {
    try {
      const result = await prisma.userRole.create({ data });
      logger.debug('UserRole created successfully', {
        data,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error creating UserRole:', { error, requestId, userId });
      throw error;
    }
  },

  async bulkCreate(
    data: UserRoleCreateManyInput[],
    requestId: string,
    userId: string,
  ) {
    try {
      const result = await prisma.userRole.createMany({ data });
      logger.debug('Bulk UserRoles created successfully', {
        data,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error bulk creating UserRoles:', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async getAll(requestId: string, userId: string) {
    try {
      const result = await prisma.userRole.findMany();
      logger.debug('Fetched all userRoles successfully', {
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error fetching all userRoles:', {
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
        prisma.userRole.findMany({ skip, take: limit }),
        prisma.userRole.count(),
      ]);

      logger.debug('Fetched paginated userRoles successfully', {
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
      logger.error('Error fetching paginated userRoles:', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string) {
    try {
      const result = await prisma.userRole.findUnique({ where: { id } });
      logger.debug('Fetched UserRole by ID successfully', {
        id,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error fetching UserRole by ID:', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async getByUserId(userId: string, currentUserId: string, requestId: string) {
    try {
      const result = await prisma.userRole.findMany({
        where: { userId: currentUserId },
      });
      logger.debug('Fetched UserRole by user ID successfully', {
        userId,
        result,
        requestId,
        currentUserId,
      });
      return result;
    } catch (error) {
      logger.error('Error fetching UserRole by user ID:', {
        userId,
        error,
        requestId,
      });
      throw error;
    }
  },

  async update(
    id: string,
    data: UserRoleUpdateInput,
    requestId: string,
    userId: string,
  ) {
    try {
      const result = await prisma.userRole.update({ where: { id }, data });
      logger.debug('Updated UserRole successfully', {
        id,
        data,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error updating UserRole with ID:', {
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
      const result = await prisma.userRole.delete({ where: { id } });
      logger.debug('Deleted UserRole successfully', {
        id,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error deleting UserRole with ID:', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },
  async deleteByUserIdAndRoleId(
    userId: string,
    roleId: string,
    requestId: string,
    currentUserId: string,
  ) {
    try {
      const result = await prisma.userRole.deleteMany({
        where: { userId, roleId },
      });
      logger.debug('Deleted UserRole by user ID and role ID successfully', {
        userId,
        roleId,
        result,
        requestId,
        currentUserId,
      });
      return result;
    } catch (error) {
      logger.error('Error deleting UserRole by user ID and role ID:', {
        userId,
        roleId,
        error,
        requestId,
        currentUserId,
      });
      throw error;
    }
  },
};
