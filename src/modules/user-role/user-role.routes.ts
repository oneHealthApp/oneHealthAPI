import { Router } from 'express';
import { UserRoleController } from './user-role.controller';
import { UserRoleValidator } from './user-role.validator';
import { validateRequest } from '../../middlewares';

const router = Router();

/**
 * Routes for UserRole module.
 */

router.post(
  '/o/user-role',
  validateRequest(UserRoleValidator.create),
  UserRoleController.create,
);

router.post(
  '/o/user-role/bulk',
  validateRequest(UserRoleValidator.bulkCreate),
  UserRoleController.bulkCreate,
);

router.get('/o/user-role', UserRoleController.getAll);

router.get('/o/user-role/page', UserRoleController.getAllPaginated);

router.get('/o/user-role/:id', UserRoleController.getById);
router.get('/o/user-role/user/:id', UserRoleController.getByUserId);

router.put(
  '/o/user-role/:id',
  validateRequest(UserRoleValidator.update),
  UserRoleController.update,
);

router.delete('/o/user-role/:id', UserRoleController.delete);
router.delete(
  '/o/user-role/user/:userid/role/:roleid',
  UserRoleController.deleteByUserIdAndRoleId,
);

export default router;
