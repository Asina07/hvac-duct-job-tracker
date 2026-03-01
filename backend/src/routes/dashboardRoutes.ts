import {Router} from 'express';
import {authenticateToken} from '../middleware/authMiddleware';
import {getDashboardData} from '../controllers/dashboardController';

const DashboardRouter = Router();

DashboardRouter.get('/', authenticateToken, getDashboardData);

export default DashboardRouter;