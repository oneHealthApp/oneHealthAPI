import { prisma } from '../../../common';
import { RoleCreateInput, RoleUpdateInput } from './role.type';
import { getModuleLogger, PaginationInput } from '../../../utils';

const logger = getModuleLogger('role-repository');

/**
 * Repository layer for direct DB access (Role entity).
 */
export const RoleRepository = {
  async create(data: RoleCreateInput, requestId: string, userId: string) {
    try {
      const result = await prisma.role.create({ data });
      logger.debug('Role created successfully', {
        data,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error creating Role:', { error, requestId, userId });
      throw error;
    }
  },

  async getAll(requestId: string, userId: string) {
    try {
      const result = await prisma.role.findMany();
      logger.debug('Fetched all roles successfully', {
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error fetching all roles:', { error, requestId, userId });
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
        prisma.role.findMany({ skip, take: limit }),
        prisma.role.count(),
      ]);

      logger.debug('Fetched paginated roles successfully', {
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
      logger.error('Error fetching paginated roles:', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string) {
    try {
      const result = await prisma.role.findUnique({ where: { id } });
      logger.debug('Fetched Role by ID successfully', {
        id,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error fetching Role by ID:', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async update(
    id: string,
    data: RoleUpdateInput,
    requestId: string,
    userId: string,
  ) {
    try {
      const result = await prisma.role.update({ where: { id }, data });
      logger.debug('Updated Role successfully', {
        id,
        data,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error updating Role with ID:', {
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
      const result = await prisma.role.delete({ where: { id } });
      logger.debug('Deleted Role successfully', {
        id,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error deleting Role with ID:', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async findManyByIds(ids: string[], requestId: string, userId: string) {
    try {
      const result = await prisma.role.findMany({
        where: {
          id: { in: ids },
        },
      });

      logger.debug('Fetched roles by IDs successfully', {
        ids,
        result,
        requestId,
        userId,
      });

      return result;
    } catch (error) {
      logger.error('Error fetching roles by IDs:', {
        ids,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async listFiltered(
    active: boolean | undefined,
    requestId: string,
    userId: string,
  ) {
    try {
      const filter = active === undefined ? {} : { isActive: active };

      const result = await prisma.role.findMany({
        where: filter,
      });

      logger.debug('Fetched filtered roles successfully', {
        active,
        result,
        requestId,
        userId,
      });

      return result;
    } catch (error) {
      logger.error('Error filtering roles:', { error, requestId, userId });
      throw error;
    }
  },
  async attachMenus(
    roleId: string,
    menus: { menuId: string; permissions: string[] }[],
    requestId: string,
    userId: string,
  ) {
    try {
      const data = menus.map((menu) => ({
        roleId,
        menuId: menu.menuId,
        permissions: menu.permissions,
        createdBy: userId,
        updatedBy: userId,
      }));

      const result = await prisma.roleMenuAccess.createMany({
        data,
        skipDuplicates: true,
      });

      logger.debug('Attached menus to role successfully', {
        roleId,
        menus,
        result,
        requestId,
        userId,
      });

      return result;
    } catch (error) {
      logger.error('Error attaching menus to role', {
        roleId,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async detachMenus(
    roleId: string,
    menuIds: string[],
    requestId: string,
    userId: string,
  ) {
    try {
      // 1. Fetch parent menus and their active submenus
      const allMenus = await prisma.menu.findMany({
        where: { id: { in: menuIds }, isActive: true },
        include: { subMenus: true },
      });

      // 2. Flatten parent + submenu IDs
      const allMenuIdsToDetach = new Set<string>();
      allMenus.forEach((menu) => {
        allMenuIdsToDetach.add(menu.id);
        menu.subMenus.forEach((sub) => allMenuIdsToDetach.add(sub.id));
      });

      // 3. Delete roleMenuAccess for all parent + submenus
      const result = await prisma.roleMenuAccess.deleteMany({
        where: {
          roleId,
          menuId: { in: Array.from(allMenuIdsToDetach) },
        },
      });

      logger.debug('Detached menus (with submenus) from role successfully', {
        roleId,
        menuIds: Array.from(allMenuIdsToDetach),
        result,
        requestId,
        userId,
      });

      // 4. Clear cache
      await this.clearCache(roleId, requestId, userId);

      return result;
    } catch (error) {
      logger.error('Error detaching menus from role', {
        roleId,
        menuIds,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },
  async getMenusWithPermissions(
    roleId: string,
    requestId: string,
    userId: string,
  ) {
    try {
      const result = await prisma.roleMenuAccess.findMany({
        where: {
          roleId,
          menu: {
            isActive: true, // ✅ Only active parent menus
          },
        },
        include: {
          menu: {
            include: {
              subMenus: {
                where: { isActive: true }, // ✅ Only active submenus
                orderBy: { displayOrdinal: 'asc' },
              },
            },
          },
        },
        orderBy: {
          menu: {
            displayOrdinal: 'asc',
          },
        },
      });

      logger.debug(
        'Fetched active role menus with permissions and submenus successfully',
        { roleId, result, requestId, userId },
      );

      // Map to include full menu details + permissions + subMenus
      return result.map((r) => ({
        ...r.menu,
        permissions: {
          create: r.create,
          read: r.read,
          update: r.update,
          delete: r.delete,
        },
        subMenus: r.menu.subMenus.map((sub) => ({
          ...sub,
          // Inherit parent permissions or set separate if needed
          permissions: {
            create: r.create,
            read: r.read,
            update: r.update,
            delete: r.delete,
          },
        })),
      }));
    } catch (error) {
      logger.error('Error fetching active role menus with permissions:', {
        roleId,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },
  async clearCache(roleId: string, requestId: string, userId: string) {
    try {
      // Implement your cache clearing logic here, e.g.:
      // await cache.del(`role:menus:${roleId}`);
      logger.debug('Cleared role-menu cache', {
        roleId,
        requestId,
        userId,
      });
      return { message: 'Cache cleared successfully' };
    } catch (error) {
      logger.error('Error clearing role-menu cache:', {
        roleId,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Find role by name and category (case-insensitive)
   */
  async findByNameAndCategory(
    roleName: string,
    roleCategory: string,
    requestId: string,
    userId: string,
  ) {
    try {
      logger.debug('Finding role by name and category', {
        roleName,
        roleCategory,
        requestId,
        userId,
      });

      return await prisma.role.findFirst({
        where: {
          roleName: {
            equals: roleName,
            mode: 'insensitive', // case-insensitive search
          },
          roleCategory: {
            equals: roleCategory,
            mode: 'insensitive',
          },
        },
      });
    } catch (error) {
      logger.error('Error finding role by name and category', {
        error,
        roleName,
        roleCategory,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async getRoleMenus(roleId: string, requestId: string, userId: string) {
    try {
      logger.debug('Fetching menus for role', { roleId });
      return await prisma.roleMenuAccess.findMany({
        where: { roleId },
        include: {
          menu: true, // Assuming you have a related `menu` table
        },
      });
    } catch (error) {
      logger.error('Error fetching role menus', { error, roleId });
      throw error;
    }
  },
};
