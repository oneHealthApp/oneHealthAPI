import { redisCacheHelper } from '../../../utils/redisCacheHelper';
import { getModuleLogger } from '../../../utils/logger';
import { MenuCreateInput, MenuUpdateInput } from './menu.type';
import { MenuRepository } from './menu.repository';
import { UserService } from '../user/user.service';
const logger = getModuleLogger('menu-service');

/**
 * Enhanced MenuService with proper Redis caching implementation
 * following patterns from RoleService
 */

// Cache key generators
const CacheKeys = {
  menu: (id: string) => `menu:${id}`,
  menuTree: () => 'menu:tree',
  roleMenus: (roleId: string) => `menu:role:${roleId}`,
  userMenus: (userId: string) => `menu:user:${userId}`,
  allMenus: () => 'menu:all',
  filteredMenus: (isActive: boolean) => `menu:filtered:${isActive}`,
};

// Cache TTLs in seconds
const CacheTTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 3600, // 1 hour
  LONG: 86400, // 24 hours
};

interface Menu {
  id: string;
  menuName: string;
  path: string;
  menuIcon: string | null;
  layout: string;
  displayOrdinal: number;
  isActive: boolean;
  childOf: string | null;
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
  children?: Menu[];
}

type UserRole = {
  roleId: string;
};

export class MenuService {
  public async clearMenuCache(
    menuId?: string,
    requestId?: string,
    userId?: string,
  ): Promise<void> {
    try {
      logger.debug('Clearing menu cache', { menuId, requestId, userId });

      const keysToDelete = [
        CacheKeys.menuTree(),
        CacheKeys.allMenus(),
        ...(menuId ? [CacheKeys.menu(menuId)] : []),
      ];

      // Clear pattern-based keys
      const patterns = [
        CacheKeys.roleMenus('*'),
        CacheKeys.userMenus('*'),
        CacheKeys.filteredMenus(true),
        CacheKeys.filteredMenus(false),
      ];

      await Promise.all([
        ...keysToDelete.map((key) => redisCacheHelper.delete(key)),
        ...patterns.map((pattern) => redisCacheHelper.deletePattern(pattern)),
      ]);
    } catch (error) {
      logger.error('Error clearing menu cache', { error, requestId, userId });
      throw error;
    }
  }

  private static buildMenuHierarchy(menus: Menu[]): Menu[] {
    const menuMap = new Map<string, Menu>();
    const rootMenus: Menu[] = [];

    // Create map entries
    menus.forEach((menu: Menu) => {
      const menuNode: Menu = {
        ...menu,
        children: [],
      };
      menuMap.set(menu.id, menuNode);
      if (!menu.childOf) rootMenus.push(menuNode);
    });

    // Build hierarchy
    menus.forEach((menu: Menu) => {
      if (menu.childOf && menuMap.has(menu.childOf)) {
        menuMap.get(menu.childOf)!.children!.push(menuMap.get(menu.id)!);
      }
    });

    // Sort menus
    const sortByOrdinal = (a: Menu, b: Menu) =>
      a.displayOrdinal - b.displayOrdinal;
    rootMenus.sort(sortByOrdinal);
    rootMenus.forEach((menu: Menu) => {
      if (menu.children!.length) {
        menu.children!.sort(sortByOrdinal);
      }
    });

    return rootMenus;
  }

  async listAllMenus(
    isActive?: boolean,
    requestId?: string,
    userId?: string,
  ): Promise<Menu[]> {
    try {
      logger.debug('Listing all menus', { isActive, requestId, userId });

      const cacheKey =
        isActive !== undefined
          ? CacheKeys.filteredMenus(isActive)
          : CacheKeys.allMenus();

      const cachedMenus = await redisCacheHelper.get<Menu[]>(cacheKey);
      if (cachedMenus) return cachedMenus;

      const menus = (await MenuRepository.findAll(
        isActive,
        requestId,
        userId,
      )) as Menu[];

      await redisCacheHelper.set(
        cacheKey,
        menus,
        isActive !== undefined ? CacheTTL.MEDIUM : CacheTTL.LONG,
      );

      return menus;
    } catch (error) {
      logger.error('Error listing menus', { error, requestId, userId });
      throw error;
    }
  }

  async getMenuById(
    id: string,
    requestId?: string,
    userId?: string,
  ): Promise<Menu | null> {
    try {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('Invalid or missing menu ID');
      }

      logger.debug('Getting menu by ID', { id, requestId, userId });

      const cacheKey = CacheKeys.menu(id);
      const cachedMenu = await redisCacheHelper.get<Menu>(cacheKey);
      if (cachedMenu) return cachedMenu;

      const menu = (await MenuRepository.findById(
        id,
        requestId,
        userId,
      )) as Menu | null;

      if (menu) {
        await redisCacheHelper.set(cacheKey, menu, CacheTTL.MEDIUM);
      }

      return menu;
    } catch (error) {
      logger.error('Error getting menu by ID', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  }

  async getRoleMenus(
    roleId: string,
    requestId?: string,
    userId?: string,
  ): Promise<Menu[]> {
    try {
      if (!roleId || typeof roleId !== 'string' || roleId.trim() === '') {
        throw new Error('Invalid or missing role ID');
      }

      logger.debug('Getting role menus', { roleId, requestId, userId });

      const cacheKey = CacheKeys.roleMenus(roleId);
      const cachedMenus = await redisCacheHelper.get<Menu[]>(cacheKey);
      if (cachedMenus) return cachedMenus;

      const menus = (await MenuRepository.findByRoleId(
        roleId,
        requestId,
        userId,
      )) as Menu[];

      if (!menus || menus.length === 0) {
        await redisCacheHelper.set(cacheKey, [], CacheTTL.SHORT);
        return [];
      }

      const menuHierarchy = MenuService.buildMenuHierarchy(menus);
      await redisCacheHelper.set(cacheKey, menuHierarchy, CacheTTL.MEDIUM);

      return menuHierarchy;
    } catch (error) {
      logger.error('Error getting role menus', {
        roleId,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  }

  async createMenu(
    data: MenuCreateInput,
    requestId?: string,
    userId?: string,
  ): Promise<Menu> {
    try {
      logger.debug('Creating menu', { data, requestId, userId });

      // Validate input
      if (!data.menuName || typeof data.menuName !== 'string') {
        throw new Error('Menu name is required and must be a string');
      }

      // Transform subMenus into Prisma nested create if provided
      if (
        data.subMenus &&
        Array.isArray(data.subMenus) &&
        data.subMenus.length > 0
      ) {
        data.subMenus = { create: data.subMenus };
      } else {
        delete data.subMenus;
      }

      // Create menu in database
      const menu = (await MenuRepository.create(
        data,
        requestId,
        userId,
      )) as Menu;

      // Cache the new menu
      await redisCacheHelper.set(
        CacheKeys.menu(menu.id),
        menu,
        CacheTTL.MEDIUM,
      );

      // Invalidate relevant caches
      await this.clearMenuCache(undefined, requestId, userId);

      return menu;
    } catch (error) {
      logger.error('Error creating menu', { data, error, requestId, userId });
      throw error;
    }
  }

  async updateMenu(
    id: string,
    data: MenuUpdateInput,
    requestId?: string,
    userId?: string,
  ): Promise<Menu | null> {
    try {
      logger.debug('Updating menu', { id, data, requestId, userId });

      const existingMenu = await this.getMenuById(id, requestId, userId);
      if (!existingMenu) {
        throw new Error(`Menu with id ${id} not found`);
      }

      // Transform subMenus array into Prisma nested create
      if (data.subMenus && Array.isArray(data.subMenus)) {
        data.subMenus = { create: data.subMenus };
      }

      const updatedMenu = (await MenuRepository.update(
        id,
        data,
        requestId,
        userId,
      )) as Menu | null;

      if (updatedMenu) {
        // Update cache
        await redisCacheHelper.set(
          CacheKeys.menu(id),
          updatedMenu,
          CacheTTL.MEDIUM,
        );

        // Invalidate relevant caches
        await this.clearMenuCache(id, requestId, userId);
      }

      return updatedMenu;
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

  async deleteMenu(
    id: string,
    requestId?: string,
    userId?: string,
  ): Promise<Menu | null> {
    try {
      logger.debug('Deleting menu', { id, requestId, userId });

      const existingMenu = await this.getMenuById(id, requestId, userId);
      if (!existingMenu) {
        throw new Error(`Menu with id ${id} not found`);
      }

      const deletedMenu = (await MenuRepository.softDelete(
        id,
        requestId,
        userId,
      )) as Menu | null;

      if (deletedMenu) {
        // Clear cache for this menu
        await redisCacheHelper.delete(CacheKeys.menu(id));

        // Invalidate relevant caches
        await this.clearMenuCache(id, requestId, userId);
      }

      return deletedMenu;
    } catch (error) {
      logger.error('Error deleting menu', { id, error, requestId, userId });
      throw error;
    }
  }

  async getMenuTree(requestId?: string, userId?: string): Promise<Menu[]> {
    try {
      logger.debug('Getting menu tree', { requestId, userId });

      const cacheKey = CacheKeys.menuTree();
      const cachedTree = await redisCacheHelper.get<Menu[]>(cacheKey);
      if (cachedTree) return cachedTree;

      const menus = (await MenuRepository.findAllWithHierarchy(
        requestId,
        userId,
      )) as Menu[];

      if (!menus || menus.length === 0) {
        await redisCacheHelper.set(cacheKey, [], CacheTTL.MEDIUM);
        return [];
      }

      const tree = MenuService.buildMenuHierarchy(menus);
      await redisCacheHelper.set(cacheKey, tree, CacheTTL.MEDIUM);

      return tree;
    } catch (error) {
      logger.error('Error getting menu tree', { error, requestId, userId });
      throw error;
    }
  }

  async getUserMenus(
    targetUserId: string,
    requestId?: string,
    requestingUserId?: string,
  ): Promise<Menu[]> {
    try {
      if (
        !targetUserId ||
        typeof targetUserId !== 'string' ||
        targetUserId.trim() === ''
      ) {
        throw new Error('Invalid or missing user ID');
      }

      logger.debug('Getting user menus', {
        targetUserId,
        requestId,
        requestingUserId,
      });

      const cacheKey = CacheKeys.userMenus(targetUserId);
      const cachedMenus = await redisCacheHelper.get<Menu[]>(cacheKey);
      if (cachedMenus) return cachedMenus;

      // Get user roles from UserService
      const userRoles: UserRole[] =
        await UserService.getUserRoles(targetUserId);
      if (!userRoles?.length) {
        await redisCacheHelper.set(cacheKey, [], CacheTTL.SHORT);
        return [];
      }

      // Get menus for all roles
      const roleIds = userRoles.map((ur: UserRole) => ur.roleId);
      const roleMenus = (await MenuRepository.findByRoleIds(
        roleIds,
        requestId,
        requestingUserId,
      )) as Menu[];

      if (!roleMenus.length) {
        await redisCacheHelper.set(cacheKey, [], CacheTTL.SHORT);
        return [];
      }

      // Remove duplicates and build hierarchy
      const uniqueMenus = [
        ...new Map(roleMenus.map((menu: Menu) => [menu.id, menu])).values(),
      ];
      const menuHierarchy = MenuService.buildMenuHierarchy(uniqueMenus);

      // Cache with shorter TTL since user roles might change
      await redisCacheHelper.set(cacheKey, menuHierarchy, CacheTTL.SHORT);

      return menuHierarchy;
    } catch (error) {
      logger.error('Error getting user menus', {
        targetUserId,
        error,
        requestId,
        requestingUserId,
      });

      // Fallback to cached data if available
      const fallback = await redisCacheHelper.get<Menu[]>(
        CacheKeys.userMenus(targetUserId),
      );
      if (fallback) {
        logger.warn('Using cached menus as fallback due to error', {
          targetUserId,
        });
        return fallback;
      }

      throw error;
    }
  }
}
