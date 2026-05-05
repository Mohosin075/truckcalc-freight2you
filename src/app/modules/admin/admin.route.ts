import express from 'express';
import { USER_ROLES } from '../../../enum/user';
import auth from '../../middleware/auth';
import { AdminController } from './admin.controller';

const router = express.Router();

router.get(
  '/stats',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  AdminController.getDashboardStats
);

router.get(
  '/users',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  AdminController.getAllUsers
);

router.get(
  '/subscriptions',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  AdminController.getSubscriptions
);

router.get(
  '/plans',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  AdminController.getSubscriptionPlans
);

export const AdminRoutes = router;
