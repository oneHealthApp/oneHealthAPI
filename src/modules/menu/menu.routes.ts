import { Router } from 'express';
import { MenuController } from './menu.controller';
import { MenuValidator } from './menu.validator';
import { validateRequest } from '../../middlewares';

const router = Router();

/**
 * Routes for Menu module.
 */

router.post(
  '/menus',
  validateRequest(MenuValidator.create),
  MenuController.create,
);

router.get('/menus', MenuController.getAll);

router.get('/menus/page', MenuController.getAllPaginated);

router.get('/menus/:id', MenuController.getById);

router.put(
  '/menus/:id',
  validateRequest(MenuValidator.update),
  MenuController.update,
);

router.get('/menus/user/:userId', MenuController.getByUserId);

router.delete('/menus/:id', MenuController.delete);

export default router;
