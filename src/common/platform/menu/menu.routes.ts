import { Router } from 'express';
import { validateRequest } from '../../../middlewares';
import { MenuController } from './menu.controller';
import { MenuValidator } from './menu.validator';
import { UserValidator } from '../user/user.validator';

const router = Router();

// Menu Tree Routes
router.get('/menu/tree', MenuController.getMenuTree);

// Menu Management Routes
router.get(
  '/menu',
  validateRequest(MenuValidator.list),
  MenuController.listAllMenus,
);
router.get('/menu/:id', MenuController.getMenuById);
router.get('/menu/role/:roleId', MenuController.getRoleMenus);
router.get('/menu/user/:userId', MenuController.getUserMenus);
router.post(
  '/menu',
  validateRequest(MenuValidator.create),
  MenuController.createMenu,
);
router.put(
  '/menu/:id',
  validateRequest(MenuValidator.update),
  MenuController.updateMenu,
);
router.delete('/menu/:id', MenuController.deleteMenu);

// Cache Management
router.post('/cache/clear', MenuController.clearMenuCache);

export default router;
