import { RoleCreateInput, RoleUpdateInput } from './role.type';
import { RoleRepository } from './role.repository';
import { getModuleLogger, PaginationInput } from '../../../utils';
import { prisma } from '../../../common';
import { redisCacheHelper } from '../../../utils/redisCacheHelper';

const logger = getModuleLogger('role-service');

export const RoleService = {
  async create(data: RoleCreateInput, requestId: string, userId: string) {
    try {
      logger.debug('Creating Role', { data, requestId, userId });

      if (!data.roleCategory || typeof data.roleCategory !== 'string') {
        throw new Error('Role category is required and must be a string.');
      }
      const existing = await RoleRepository.findByNameAndCategory(
        data.roleName,
        data.roleCategory,
        requestId,
        userId,
      );
      if (existing) {
        logger.warn('Duplicate role creation attempt', {
          roleName: data.roleName,
          roleCategory: data.roleCategory,
          requestId,
          userId,
        });
        throw new Error(
          `Role "${data.roleName}" already exists in category "${data.roleCategory}".`,
        );
      }

      if (data.priority < 1 || data.priority > 10) {
        throw new Error('Priority must be between 1 and 10.');
      }

      if (data.isActive === undefined) {
        data.isActive = true;
      }

      const role = await RoleRepository.create(data, requestId, userId);

      // Clear caches related to roles
      await this.clearCache(role.id, requestId, userId);

      return role;
    } catch (error: any) {
      logger.error('Error creating Role', { error, requestId, userId });
      if (error.code === 'P2002')
        throw new Error(`Role "${data.roleName}" already exists.`);
      throw error;
    }
  },

  async getAll(requestId: string, userId: string) {
    try {
      logger.debug('Fetching all roles', { requestId, userId });

      const cacheKey = 'role:all';
      const cached = await redisCacheHelper.get(cacheKey);
      if (cached) return cached;

      const roles = await RoleRepository.getAll(requestId, userId);
      await redisCacheHelper.set(cacheKey, roles, 300);
      return roles;
    } catch (error) {
      logger.error('Error fetching all roles', { error, requestId, userId });
      throw error;
    }
  },

  async getPaginated(
    pagination: PaginationInput,
    requestId: string,
    userId: string,
  ) {
    try {
      logger.debug('Fetching paginated roles', {
        pagination,
        requestId,
        userId,
      });

      const cacheKey = `role:paginated:${pagination.page}:${pagination.pageSize}:${JSON.stringify(pagination.filters || {})}`;
      const cached = await redisCacheHelper.get(cacheKey);
      if (cached) return cached;

      const result = await RoleRepository.getPaginated(
        pagination,
        requestId,
        userId,
      );
      await redisCacheHelper.set(cacheKey, result, 300);
      return result;
    } catch (error) {
      logger.error('Error fetching paginated roles', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string) {
    try {
      if (!id || typeof id !== 'string' || id.trim() === '')
        throw new Error('Invalid or missing role ID');

      logger.debug('Fetching Role by ID', { id, requestId, userId });

      const cacheKey = `role:${id}`;
      const cached = await redisCacheHelper.get(cacheKey);
      if (cached) return cached;

      const role = await RoleRepository.get(id, requestId, userId);
      if (role) await redisCacheHelper.set(cacheKey, role, 600);
      return role;
    } catch (error) {
      logger.error('Error fetching Role by ID', {
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
      logger.debug('Updating Role', { id, data, requestId, userId });

      const existingRole = await RoleRepository.get(id, requestId, userId);
      if (!existingRole) throw new Error('Role not found');

      if (data.roleName && data.roleCategory) {
        const roleName =
          typeof data.roleName === 'string'
            ? data.roleName
            : data.roleName?.set;
        const roleCategory =
          typeof data.roleCategory === 'string'
            ? data.roleCategory
            : data.roleCategory?.set;
        if (!roleName || !roleCategory)
          throw new Error(
            'Role name and category must be provided as strings.',
          );

        const duplicate = await RoleRepository.findByNameAndCategory(
          roleName,
          roleCategory,
          requestId,
          userId,
        );
        if (duplicate && duplicate.id !== id)
          throw new Error(
            `Role "${data.roleName}" already exists in category "${data.roleCategory}".`,
          );
      }

      if (data.priority !== undefined && typeof data.priority === 'number') {
        if (data.priority < 1 || data.priority > 10)
          throw new Error('Priority must be between 1 and 10.');
      }

      const updatedRole = await RoleRepository.update(
        id,
        { ...data, updatedBy: userId },
        requestId,
        userId,
      );

      // Clear caches related to roles
      await this.clearCache(updatedRole.id, requestId, userId);

      return updatedRole;
    } catch (error: any) {
      logger.error('Error updating Role', { id, error, requestId, userId });
      if (error.code === 'P2002')
        throw new Error(`Role "${data.roleName}" already exists.`);
      throw error;
    }
  },

  async delete(id: string, requestId: string, userId: string) {
    try {
      logger.debug('Deleting role', { id, requestId, userId });

      const role = await RoleRepository.get(id, requestId, userId);
      if (!role) throw new Error('Role not found');
      if (role.isActive)
        throw new Error(
          'Cannot delete an active role. Please deactivate first.',
        );

      const assignedUserCount = await prisma.userRole.count({
        where: { roleId: id },
      });
      if (assignedUserCount > 0) {
        await prisma.userRole.deleteMany({ where: { roleId: id } });
      }

      const deleted = await RoleRepository.delete(id, requestId, userId);

      // Clear caches related to roles
      await this.clearCache(deleted.id, requestId, userId);

      return deleted;
    } catch (error) {
      logger.error('Error deleting role', { id, error, requestId, userId });
      throw error;
    }
  },

  async listFiltered(active: boolean, requestId: string, userId: string) {
    try {
      logger.debug('Fetching filtered roles', { active, requestId, userId });

      const cacheKey = `role:filtered:${active}`;
      const cached = await redisCacheHelper.get(cacheKey);
      if (cached) return cached;

      const filteredList = await RoleRepository.listFiltered(
        active,
        requestId,
        userId,
      );
      if (!filteredList || filteredList.length === 0)
        throw new Error(`No ${active ? 'active' : 'inactive'} user found`);

      await redisCacheHelper.set(cacheKey, filteredList, 300);
      return filteredList;
    } catch (error) {
      logger.error('Error fetching filtered roles', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async attachMenus(
    roleId: string,
    menus: { menuId: string; permissions: string[] }[],
    requestId: string,
    userId: string,
    createdBy: string,
    updatedBy: string,
  ) {
    try {
      logger.debug('Attaching menus to role', {
        roleId,
        menus,
        requestId,
        userId,
      });

      const roleExists = await prisma.role.findUnique({
        where: { id: roleId },
      });
      if (!roleExists) throw new Error(`Role with id ${roleId} does not exist`);

      const menuIds = menus.map((m) => m.menuId);

      // Fetch menus and submenus
      const allMenus = await prisma.menu.findMany({
        where: { id: { in: menuIds }, isActive: true },
        include: {
          subMenus: { where: { isActive: true } },
        },
      });

      // Flatten parent + submenu list
      const roleMenuData: {
        createdBy: string;
        updatedBy: string;
        create: boolean;
        read: boolean;
        update: boolean;
        delete: boolean;
        roleId: string;
        menuId: string;
      }[] = [];
      for (const menu of menus) {
        const parentMenu = allMenus.find((m) => m.id === menu.menuId);
        if (!parentMenu) continue;

        const perms = {
          create: menu.permissions.includes('create'),
          read: menu.permissions.includes('read'),
          update: menu.permissions.includes('update'),
          delete: menu.permissions.includes('delete'),
        };

        // Add parent menu
        roleMenuData.push({
          roleId,
          menuId: parentMenu.id,
          ...perms,
          createdBy,
          updatedBy,
        });

        // Add submenus with same permissions
        parentMenu.subMenus.forEach((sub) => {
          roleMenuData.push({
            roleId,
            menuId: sub.id,
            ...perms,
            createdBy,
            updatedBy,
          });
        });
      }

      // Upsert using transaction
      const result = await prisma.$transaction(async (tx) => {
        const res = [];
        for (const data of roleMenuData) {
          const existing = await tx.roleMenuAccess.findFirst({
            where: { roleId: data.roleId, menuId: data.menuId },
          });

          if (existing) {
            res.push(
              await tx.roleMenuAccess.update({
                where: { id: existing.id },
                data: {
                  create: data.create,
                  read: data.read,
                  update: data.update,
                  delete: data.delete,
                  updatedBy: data.updatedBy,
                },
              }),
            );
          } else {
            res.push(await tx.roleMenuAccess.create({ data }));
          }
        }
        return res;
      });

      // Clear cache
      await this.clearCache(roleId, requestId, userId);

      return result;
    } catch (error) {
      logger.error('Error attaching menus to role', {
        roleId,
        error,
        requestId,
        userId,
        createdBy,
        updatedBy,
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
      logger.debug('Detaching menus from role', {
        roleId,
        menuIds,
        requestId,
        userId,
      });
      if (!menuIds || menuIds.length === 0)
        throw new Error('At least one menu ID is required to detach.');

      const role = await RoleRepository.get(roleId, requestId, userId);
      if (!role) throw new Error(`Role with id ${roleId} not found`);
      if (!role.isActive)
        throw new Error('Cannot detach menus from an inactive role.');

      const roleMenus = await RoleRepository.getRoleMenus(
        roleId,
        requestId,
        userId,
      );
      const invalidIds = menuIds.filter(
        (id) => !roleMenus.map((m) => m.menuId).includes(id),
      );
      if (invalidIds.length > 0)
        throw new Error(
          `Cannot detach menus that are not linked to role: ${invalidIds.join(', ')}`,
        );

      const result = await RoleRepository.detachMenus(
        roleId,
        menuIds,
        requestId,
        userId,
      );

      // // Invalidate caches
      await this.clearCache(roleId, requestId, userId);

      return result;
    } catch (error) {
      logger.error('Error detaching menus from role', {
        roleId,
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
      logger.debug('Fetching role menus with permissions', {
        roleId,
        requestId,
        userId,
      });

      const cacheKey = `role:${roleId}:menus`;
      const cached = await redisCacheHelper.get(cacheKey);
      if (cached) return cached;

      const role = await RoleRepository.get(roleId, requestId, userId);
      if (!role) throw new Error('Role not found');
      if (!role.isActive)
        throw new Error('Cannot fetch menus for an inactive role');

      const menusWithPermissions = await RoleRepository.getMenusWithPermissions(
        roleId,
        requestId,
        userId,
      );
      await redisCacheHelper.set(cacheKey, menusWithPermissions, 300);
      return menusWithPermissions;
    } catch (error) {
      logger.error('Error fetching role menus', {
        error,
        roleId,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async clearCache(roleId: string, requestId: string, userId: string) {
    try {
      logger.debug('Clearing role-menu cache', { roleId, requestId, userId });
      await redisCacheHelper.delete(`role:${roleId}`);
      await redisCacheHelper.delete(`role:${roleId}:menus`);
      await redisCacheHelper.delete('role:all');
      // await redisCacheHelper.deletePattern('role:paginated:*');
      // await redisCacheHelper.deletePattern('role:filtered:*');
      return true;
    } catch (error) {
      logger.error('Error clearing cache', { error, requestId, userId });
      throw error;
    }
  },
};
