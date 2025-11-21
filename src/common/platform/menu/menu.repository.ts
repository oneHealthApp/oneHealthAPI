import { prisma } from '../../../common';
import { getModuleLogger } from '../../../utils/logger';
import { MenuCreateInput, MenuUpdateInput } from './menu.type';
const logger = getModuleLogger('menu-repository');

/**
 * Repository layer for Menu database operations.
 */
export class MenuRepository {
  static async findAll(
    isActive?: boolean,
    requestId?: string,
    userId?: string,
  ) {
    try {
      logger.debug('Finding all menus', { isActive, requestId, userId });
      const where = isActive !== undefined ? { isActive } : {};
      return await prisma.menu.findMany({
        where,
        orderBy: { displayOrdinal: 'asc' },
      });
    } catch (error) {
      logger.error('Error finding all menus', { error, requestId, userId });
      throw error;
    }
  }

  static async findById(id: string, requestId?: string, userId?: string) {
    try {
      logger.debug('Finding menu by ID', { id, requestId, userId });
      return await prisma.menu.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Error finding menu by ID', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  }

  static async findByRoleId(
    roleId: string,
    requestId?: string,
    userId?: string,
  ) {
    try {
      logger.debug('Finding menus by role ID', { roleId, requestId, userId });
      const roleMenus = await prisma.roleMenuAccess.findMany({
        where: { roleId },
        include: {
          menu: true,
        },
      });
      return roleMenus.map((rm) => rm.menu);
    } catch (error) {
      logger.error('Error finding menus by role ID', {
        roleId,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  }

  static async findByRoleIds(
    roleIds: string[],
    requestId?: string,
    userId?: string,
  ) {
    try {
      logger.debug('Finding menus by role IDs', { roleIds, requestId, userId });
      const roleMenus = await prisma.roleMenuAccess.findMany({
        where: { roleId: { in: roleIds } },
        include: {
          menu: true,
        },
      });
      return roleMenus.map((rm) => rm.menu);
    } catch (error) {
      logger.error('Error finding menus by role IDs', {
        roleIds,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  }

  static async findAllWithHierarchy(requestId?: string, userId?: string) {
    try {
      logger.debug('Finding all menus with hierarchy', { requestId, userId });
      return await prisma.menu.findMany({
        where: { isActive: true },
        orderBy: { displayOrdinal: 'asc' },
      });
    } catch (error) {
      logger.error('Error finding all menus with hierarchy', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  }

  static async create(
    data: MenuCreateInput,
    requestId?: string,
    userId?: string,
  ) {
    try {
      logger.debug('Creating menu', { data, requestId, userId });
      return await prisma.menu.create({ data });
    } catch (error) {
      logger.error('Error creating menu', { data, error, requestId, userId });
      throw error;
    }
  }

  static async update(
    id: string,
    data: MenuUpdateInput,
    requestId?: string,
    userId?: string,
  ) {
    try {
      logger.debug('Updating menu', { id, data, requestId, userId });

      // Transform subMenus array into Prisma nested create
      if (data.subMenus && Array.isArray(data.subMenus)) {
        data.subMenus = { create: data.subMenus };
      }

      return await prisma.menu.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Error updating menu', {
        id,
        data,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  }

  static async softDelete(id: string, requestId?: string, userId?: string) {
    try {
      logger.debug('Soft deleting menu', { id, requestId, userId });
      return await prisma.menu.update({
        where: { id },
        data: {
          isActive: false,
          updatedBy: userId,
        },
      });
    } catch (error) {
      logger.error('Error soft deleting menu', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  }
}
