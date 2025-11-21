import { Router } from 'express';
import { RoleController } from './role.controller';
import { RoleValidator } from './role.validator';
import { validateRequest } from '../../middlewares';

const router = Router();

/**
 * Routes for Role module.
 */

router.post(
  '/roles',
  validateRequest(RoleValidator.create),
  RoleController.create,
);

router.get('/roles', RoleController.getAll);

router.get('/roles/page', RoleController.getAllPaginated);

router.get('/roles/:id', RoleController.getById);

router.put(
  '/roles/:id',
  validateRequest(RoleValidator.update),
  RoleController.update,
);

router.delete('/roles/:id', RoleController.delete);

export default router;
