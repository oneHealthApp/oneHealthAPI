import {
  RoleMenuAccessCreateInput,
  RoleMenuAccessCreateManyInput,
  RoleMenuAccessUpdateInput,
} from './role-menu-access.type';
import { RoleMenuAccessRepository } from './role-menu-access.repository';
import { getModuleLogger, PaginationInput } from '../../utils';

const logger = getModuleLogger('role-menu-access-service');

/**
 * Business logic layer for RoleMenuAccess operations.
 */
export const RoleMenuAccessService = {
  async create(
    data: RoleMenuAccessCreateInput,
    requestId: string,
    userId: string,
  ) {
    try {
      logger.debug('Creating RoleMenuAccess', { data, requestId, userId });
      return await RoleMenuAccessRepository.create(data, requestId, userId);
    } catch (error) {
      logger.error('Error creating RoleMenuAccess', {
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
      logger.debug('Creating bulk RoleMenuAccess', { data, requestId, userId });
      return await RoleMenuAccessRepository.bulkCreate(data, requestId, userId);
    } catch (error) {
      logger.error('Error creating bulk RoleMenuAccess', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async getAll(requestId: string, userId: string) {
    try {
      logger.debug('Fetching all roleMenuAccesss', { requestId, userId });
      return await RoleMenuAccessRepository.getAll(requestId, userId);
    } catch (error) {
      logger.error('Error fetching all roleMenuAccesss', {
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
      logger.debug('Fetching paginated roleMenuAccesss', {
        pagination,
        requestId,
        userId,
      });
      return await RoleMenuAccessRepository.getPaginated(
        pagination,
        requestId,
        userId,
      );
    } catch (error) {
      logger.error('Error fetching paginated roleMenuAccesss', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string) {
    try {
      return await RoleMenuAccessRepository.get(id, requestId, userId);
    } catch (error) {
      logger.error('Error fetching RoleMenuAccess by ID', {
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
      logger.debug('Fetching RoleMenuAccess by role ID', {
        roleId,
        requestId,
        userId,
      });
      return await RoleMenuAccessRepository.getByRole(
        roleId,
        requestId,
        userId,
      );
    } catch (error) {
      logger.error('Error fetching RoleMenuAccess by role ID', {
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
      const exists = await RoleMenuAccessRepository.get(id, requestId, userId);
      if (!exists) return null;
      logger.debug('Updating RoleMenuAccess', { id, data, requestId, userId });
      return await RoleMenuAccessRepository.update(id, data, requestId, userId);
    } catch (error) {
      logger.error('Error updating RoleMenuAccess', {
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
      const exists = await RoleMenuAccessRepository.get(id, requestId, userId);
      if (!exists) return null;
      logger.debug('Deleting RoleMenuAccess', { id, requestId, userId });
      return await RoleMenuAccessRepository.delete(id, requestId, userId);
    } catch (error) {
      logger.error('Error deleting RoleMenuAccess', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },
};
