import { prisma } from "../../common";
import { MenuCreateInput, MenuUpdateInput } from "./menu.type";
import { getModuleLogger, PaginationInput } from "../../utils";

const logger = getModuleLogger("menu-repository");

/**
 * Repository layer for direct DB access (Menu entity).
 */
export const MenuRepository = {
  async create(data: MenuCreateInput, requestId: string, userId: string) {
    try {
      const result = await prisma.menu.create({ data });
      logger.debug("Menu created successfully", { data, result, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error creating Menu:", { error, requestId, userId });
      throw error;
    }
  },

  async getAll(requestId: string, userId: string) {
    try {
      const result = await prisma.menu.findMany();
      logger.debug("Fetched all menus successfully", { result, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error fetching all menus:", { error, requestId, userId });
      throw error;
    }
  },

  async getPaginated(pagination: PaginationInput, requestId: string, userId: string) {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const [data, total] = await prisma.$transaction([
        prisma.menu.findMany({ skip, take: limit }),
        prisma.menu.count(),
      ]);

      logger.debug("Fetched paginated menus successfully", {
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
      logger.error("Error fetching paginated menus:", { error, requestId, userId });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string) {
    try {
      const result = await prisma.menu.findUnique({ where: { id } });
      logger.debug("Fetched Menu by ID successfully", { id, result, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error fetching Menu by ID:", { id, error, requestId, userId });
      throw error;
    }
  },

  async update(id: string, data: MenuUpdateInput, requestId: string, userId: string) {
    try {
      const result = await prisma.menu.update({ where: { id }, data });
      logger.debug("Updated Menu successfully", { id, data, result, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error updating Menu with ID:", { id, error, requestId, userId });
      throw error;
    }
  },

  async delete(id: string, requestId: string, userId: string) {
    try {
      const result = await prisma.menu.delete({ where: { id } });
      logger.debug("Deleted Menu successfully", { id, result, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error deleting Menu with ID:", { id, error, requestId, userId });
      throw error;
    }
  },
};