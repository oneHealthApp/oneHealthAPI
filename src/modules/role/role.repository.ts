import { prisma } from "../../common";
import { RoleCreateInput, RoleUpdateInput } from "./role.type";
import { getModuleLogger, PaginationInput } from "../../utils";

const logger = getModuleLogger("role-repository");

/**
 * Repository layer for direct DB access (Role entity).
 */
export const RoleRepository = {
  async create(data: RoleCreateInput, requestId: string, userId: string) {
    try {
      const result = await prisma.role.create({ data });
      logger.debug("Role created successfully", { data, result, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error creating Role:", { error, requestId, userId });
      throw error;
    }
  },

  async getAll(requestId: string, userId: string) {
    try {
      const result = await prisma.role.findMany();
      logger.debug("Fetched all roles successfully", { result, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error fetching all roles:", { error, requestId, userId });
      throw error;
    }
  },

  async getPaginated(pagination: PaginationInput, requestId: string, userId: string) {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const [data, total] = await prisma.$transaction([
        prisma.role.findMany({ skip, take: limit }),
        prisma.role.count(),
      ]);

      logger.debug("Fetched paginated roles successfully", {
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
      logger.error("Error fetching paginated roles:", { error, requestId, userId });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string) {
    try {
      const result = await prisma.role.findUnique({ where: { id } });
      logger.debug("Fetched Role by ID successfully", { id, result, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error fetching Role by ID:", { id, error, requestId, userId });
      throw error;
    }
  },

  async update(id: string, data: RoleUpdateInput, requestId: string, userId: string) {
    try {
      const result = await prisma.role.update({ where: { id }, data });
      logger.debug("Updated Role successfully", { id, data, result, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error updating Role with ID:", { id, error, requestId, userId });
      throw error;
    }
  },

  async delete(id: string, requestId: string, userId: string) {
    try {
      const result = await prisma.role.delete({ where: { id } });
      logger.debug("Deleted Role successfully", { id, result, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error deleting Role with ID:", { id, error, requestId, userId });
      throw error;
    }
  },
};