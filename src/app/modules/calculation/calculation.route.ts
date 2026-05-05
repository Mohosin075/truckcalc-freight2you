import express from 'express';
import { USER_ROLES } from '../../../enum/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { CalculationController } from './calculation.controller';
import { CalculationValidation } from './calculation.validation';

const router = express.Router();

router.post(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(CalculationValidation.createCalculationValidationSchema),
  CalculationController.createCalculation
);

router.get(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  CalculationController.getCalculations
);

router.get(
  '/stats',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  CalculationController.getStats
);

router.get(
  '/export',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  CalculationController.getExportData
);

router.get(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  CalculationController.getSingleCalculation
);

router.delete(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  CalculationController.deleteCalculation
);

export const CalculationRoutes = router;
