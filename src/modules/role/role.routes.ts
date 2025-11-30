import { Router } from 'express';
import { RoleController } from './role.controller';
import { RoleValidator } from './role.validator';
import { validateRequest } from '../../middlewares';

const router = Router();

/**
 * Routes for Role module.
 */

// Create or Update Role
router.post(
  '/o/role',
  validateRequest(RoleValidator.create),
  RoleController.create,
);

// Get All Roles
router.get('/o/role', RoleController.getAll);

// Get All Roles (Paginated)
router.get('/o/role/page', RoleController.getAllPaginated);

// Get Role by ID
router.get('/o/role/:id', RoleController.getById);

// Update Role
router.put(
  '/o/role/:id',
  validateRequest(RoleValidator.update),
  RoleController.update,
);

// Delete Role
router.delete('/o/role/:id', RoleController.delete);

// GET /api/v1/role?active=true|false — filtered list by active flag
router.get('/role/filtered', RoleController.listFiltered);

// POST /api/v1/role/menu/attach — Attach menus to a role with permissions
router.post(
  '/o/role/menu/attach',
  validateRequest(RoleValidator.attachMenus),
  RoleController.attachMenus,
);

// POST /api/v1/role/menu/detach — Detach menus from a role
router.post(
  '/o/role/menu/detach',
  validateRequest(RoleValidator.detachMenus),
  RoleController.detachMenus,
);

// GET /api/v1/role/:id/menus — Get menus with permissions for a role
router.get('/o/role/:id/menus', RoleController.getRoleMenus);

// POST /api/v1/role/cache/clear/:id — Clear role-menu cache
router.post('/o/role/cache/clear/:id', RoleController.clearRoleMenuCache);

export default router;
