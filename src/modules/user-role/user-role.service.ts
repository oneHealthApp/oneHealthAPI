import {
  UserRoleCreateInput,
  UserRoleCreateManyInput,
  UserRoleUpdateInput,
} from './user-role.type';
import { UserRoleRepository } from './user-role.repository';
import { getModuleLogger, PaginationInput } from '../../utils';

const logger = getModuleLogger('user-role-service');

/**
 * Business logic layer for UserRole operations.
 */
export const UserRoleService = {
  async create(data: UserRoleCreateInput, requestId: string, userId: string) {
    try {
      logger.debug('Creating UserRole', { data, requestId, userId });
      return await UserRoleRepository.create(data, requestId, userId);
    } catch (error) {
      logger.error('Error creating UserRole', { error, requestId, userId });
      throw error;
    }
  },

  async bulkCreate(
    data: UserRoleCreateManyInput[],
    requestId: string,
    userId: string,
  ) {
    try {
      logger.debug('Bulk creating UserRoles', { data, requestId, userId });
      return await UserRoleRepository.bulkCreate(data, requestId, userId);
    } catch (error) {
      logger.error('Error bulk creating UserRoles', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async getAll(requestId: string, userId: string) {
    try {
      logger.debug('Fetching all userRoles', { requestId, userId });
      return await UserRoleRepository.getAll(requestId, userId);
    } catch (error) {
      logger.error('Error fetching all userRoles', {
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
      logger.debug('Fetching paginated userRoles', {
        pagination,
        requestId,
        userId,
      });
      return await UserRoleRepository.getPaginated(
        pagination,
        requestId,
        userId,
      );
    } catch (error) {
      logger.error('Error fetching paginated userRoles', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string) {
    try {
      return await UserRoleRepository.get(id, requestId, userId);
    } catch (error) {
      logger.error('Error fetching UserRole by ID', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async getByUserId(userId: string, requestId: string, currentUserId: string) {
    try {
      logger.debug('Fetching UserRole by user ID', {
        userId,
        requestId,
        currentUserId,
      });
      return await UserRoleRepository.getByUserId(
        userId,
        currentUserId,
        requestId,
      );
    } catch (error) {
      logger.error('Error fetching UserRole by user ID', {
        userId,
        error,
        requestId,
        currentUserId,
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
      const exists = await UserRoleRepository.get(id, requestId, userId);
      if (!exists) return null;
      logger.debug('Updating UserRole', { id, data, requestId, userId });
      return await UserRoleRepository.update(id, data, requestId, userId);
    } catch (error) {
      logger.error('Error updating UserRole', { id, error, requestId, userId });
      throw error;
    }
  },

  async delete(id: string, requestId: string, userId: string) {
    try {
      const exists = await UserRoleRepository.get(id, requestId, userId);
      if (!exists) return null;
      logger.debug('Deleting UserRole', { id, requestId, userId });
      return await UserRoleRepository.delete(id, requestId, userId);
    } catch (error) {
      logger.error('Error deleting UserRole', { id, error, requestId, userId });
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
      logger.debug('Deleting UserRole by user ID and role ID', {
        userId,
        roleId,
        requestId,
        currentUserId,
      });
      return await UserRoleRepository.deleteByUserIdAndRoleId(
        userId,
        roleId,
        requestId,
        currentUserId,
      );
    } catch (error) {
      logger.error('Error deleting UserRole by user ID and role ID', {
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
