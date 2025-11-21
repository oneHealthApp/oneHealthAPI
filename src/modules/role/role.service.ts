import { RoleCreateInput, RoleUpdateInput } from "./role.type";
import { RoleRepository } from "./role.repository";
import { getModuleLogger, PaginationInput } from "../../utils";

const logger = getModuleLogger("role-service");

/**
 * Business logic layer for Role operations.
 */
export const RoleService = {
  async create(data: RoleCreateInput, requestId: string, userId: string) {
    try {
      logger.debug("Creating Role", { data, requestId, userId });
      return await RoleRepository.create(data, requestId, userId);
    } catch (error) {
      logger.error("Error creating Role", { error, requestId, userId });
      throw error;
    }
  },

  async getAll(requestId: string, userId: string) {
    try {
      logger.debug("Fetching all roles", { requestId, userId });
      return await RoleRepository.getAll(requestId, userId);
    } catch (error) {
      logger.error("Error fetching all roles", { error, requestId, userId });
      throw error;
    }
  },

  async getPaginated(pagination: PaginationInput, requestId: string, userId: string) {
    try {
      logger.debug("Fetching paginated roles", {
        pagination,
        requestId,
        userId,
      });
      return await RoleRepository.getPaginated(pagination, requestId, userId);
    } catch (error) {
      logger.error("Error fetching paginated roles", {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string) {
    try {
      return await RoleRepository.get(id, requestId, userId);
    } catch (error) {
      logger.error("Error fetching Role by ID", { id, error, requestId, userId });
      throw error;
    }
  },

  async update(id: string, data: RoleUpdateInput, requestId: string, userId: string) {
    try {
      const exists = await RoleRepository.get(id, requestId, userId);
      if (!exists) return null;
      logger.debug("Updating Role", { id, data, requestId, userId });
      return await RoleRepository.update(id, data, requestId, userId);
    } catch (error) {
      logger.error("Error updating Role", { id, error, requestId, userId });
      throw error;
    }
  },

  async delete(id: string, requestId: string, userId: string) {
    try {
      const exists = await RoleRepository.get(id, requestId, userId);
      if (!exists) return null;
      logger.debug("Deleting Role", { id, requestId, userId });
      return await RoleRepository.delete(id, requestId, userId);
    } catch (error) {
      logger.error("Error deleting Role", { id, error, requestId, userId });
      throw error;
    }
  },
};