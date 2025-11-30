import { Router } from 'express';
// import userRoutes from './user/user.routes';
import roleRoutes from './role/role.routes';
import menuRoutes from './menu/menu.routes';
// import authRoutes from './auth/auth.routes';

const platformRouter = Router();

// Add sub-routes here

// platformRouter.use('/platform', authRoutes);
// platformRouter.use('/platform', userRoutes);
platformRouter.use('/platform', roleRoutes);
platformRouter.use('/platform', menuRoutes);


export default platformRouter;
