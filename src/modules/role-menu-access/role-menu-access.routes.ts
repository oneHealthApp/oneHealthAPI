import { Router } from 'express';
import { RoleMenuAccessController } from './role-menu-access.controller';
import { RoleMenuAccessValidator } from './role-menu-access.validator';
import { validateRequest } from '../../middlewares';

const router = Router();

/**
 * Routes for RoleMenuAccess module.
 */

router.post(
  '/o/role-menu-access',
  validateRequest(RoleMenuAccessValidator.create),
  RoleMenuAccessController.create,
);

router.post(
  '/o/role-menu-access/bulk',
  validateRequest(RoleMenuAccessValidator.bulkCreate),
  RoleMenuAccessController.bulkCreate,
);

router.get('/o/role-menu-access', RoleMenuAccessController.getAll);

router.get(
  '/o/role-menu-access/page',
  RoleMenuAccessController.getAllPaginated,
);

router.get('/o/role-menu-access/:id', RoleMenuAccessController.getById);
router.get(
  '/o/role-menu-access/role/:roleId',
  RoleMenuAccessController.getByRole,
);

router.put(
  '/o/role-menu-access/:id',
  validateRequest(RoleMenuAccessValidator.update),
  RoleMenuAccessController.update,
);

router.delete('/o/role-menu-access/:id', RoleMenuAccessController.delete);

export default router;
