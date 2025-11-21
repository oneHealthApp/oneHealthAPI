import { MenuCreateInput, MenuUpdateInput } from './menu.type';
import { MenuRepository } from './menu.repository';
import { getModuleLogger, PaginationInput } from '../../utils';
import { RoleMenuAccessService } from '../role-menu-access/role-menu-access.service';
import { UserRoleService } from '../user-role/user-role.service';

const logger = getModuleLogger('menu-service');

/**
 * Business logic layer for Menu operations.
 */
export const MenuService = {
  async create(data: MenuCreateInput, requestId: string, userId: string) {
    try {
      logger.debug('Creating Menu', { data, requestId, userId });
      return await MenuRepository.create(data, requestId, userId);
    } catch (error) {
      logger.error('Error creating Menu', { error, requestId, userId });
      throw error;
    }
  },

  async getAll(requestId: string, userId: string) {
    try {
      logger.debug('Fetching all menus', { requestId, userId });
      const menulist = await MenuRepository.getAll(requestId, userId);
      const formattedMenu = this.formatMenuHierarchically(menulist);

      return formattedMenu;
    } catch (error) {
      logger.error('Error fetching all menus', { error, requestId, userId });
      throw error;
    }
  },

  async formatMenuHierarchically(menus: any[]) {
    // Create a map of all menus by their ID for quick lookup
    const menuMap = new Map<string, any>();
    const rootMenus: any[] = [];

    // First pass: create map entries and identify root menus
    menus.forEach((menu) => {
      // Create a copy of the menu with an empty children array
      const menuWithChildren = {
        ...menu,
        children: [],
      };

      menuMap.set(menu.id, menuWithChildren);

      if (!menu.childOf) {
        rootMenus.push(menuWithChildren);
      }
    });

    // Second pass: build hierarchy
    menus.forEach((menu) => {
      if (menu.childOf) {
        const parent = menuMap.get(menu.childOf);
        if (parent) {
          parent.children.push(menuMap.get(menu.id));
        }
      }
    });

    // Sort root menus and their children by displayOrdinal
    rootMenus.sort((a, b) => a.displayOrdinal - b.displayOrdinal);

    menuMap.forEach((menu) => {
      if (menu.children.length > 0) {
        menu.children.sort(
          (a: any, b: any) => a.displayOrdinal - b.displayOrdinal,
        );
      }
    });

    return rootMenus;
  },

  async getPaginated(
    pagination: PaginationInput,
    requestId: string,
    userId: string,
  ) {
    try {
      logger.debug('Fetching paginated menus', {
        pagination,
        requestId,
        userId,
      });
      return await MenuRepository.getPaginated(pagination, requestId, userId);
    } catch (error) {
      logger.error('Error fetching paginated menus', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string) {
    try {
      return await MenuRepository.get(id, requestId, userId);
    } catch (error) {
      logger.error('Error fetching Menu by ID', {
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
    data: MenuUpdateInput,
    requestId: string,
    userId: string,
  ) {
    try {
      const exists = await MenuRepository.get(id, requestId, userId);
      if (!exists) return null;
      logger.debug('Updating Menu', { id, data, requestId, userId });
      return await MenuRepository.update(id, data, requestId, userId);
    } catch (error) {
      logger.error('Error updating Menu', { id, error, requestId, userId });
      throw error;
    }
  },

  async delete(id: string, requestId: string, userId: string) {
    try {
      const exists = await MenuRepository.get(id, requestId, userId);
      if (!exists) return null;
      logger.debug('Deleting Menu', { id, requestId, userId });
      return await MenuRepository.delete(id, requestId, userId);
    } catch (error) {
      logger.error('Error deleting Menu', { id, error, requestId, userId });
      throw error;
    }
  },

  async getByUserId(userId: string, requestId: string, currentUserId: string) {
    try {
        logger.debug('Fetching menus for user', { userId, requestId, currentUserId });
        
        // 1. Get user's roles
        const userRoles = await UserRoleService.getByUserId(userId, requestId, currentUserId);
        
        // 2. Get menu access for these roles
        const menuAccessList = await Promise.all(
            userRoles.map(role => 
                RoleMenuAccessService.getByRole(role.roleId, requestId, currentUserId)
            )
        );
        
        // 3. Get all menus (using your existing method)
        const allMenus = await this.getAll(requestId, currentUserId);
        
        // 4. Filter menus based on access
        const accessibleMenuIds = new Set(
            menuAccessList.flatMap(accessList => 
                accessList.map(access => access.menuId)
            )
        );
        
        // 5. Return filtered hierarchical menus
        return this.filterMenusByAccess(allMenus, accessibleMenuIds);
        
    } catch (error) {
        logger.error('Error fetching user menus', {
            userId,
            error,
            requestId,
            currentUserId
        });
        throw error;
    }
},

 filterMenusByAccess(menus: any[], accessibleMenuIds: Set<string>): any[] {
    return menus
        .filter(menu => accessibleMenuIds.has(menu.id))
        .map(menu => ({
            ...menu,
            children: menu.children ? this.filterMenusByAccess(menu.children, accessibleMenuIds) : []
        }))
        .filter(menu => menu.children.length > 0 || accessibleMenuIds.has(menu.id));
}
};
