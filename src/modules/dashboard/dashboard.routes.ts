
import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { jwtMiddleware } from '../../middlewares';
const router = Router();

 
router.post(
  '/o/dashboard/analyticaldata',
  DashboardController.getAnalyticalDashboardData,
);

export default router;


