import express from 'express'
import auth from '../../middleware/auth'
import validateRequest from '../../middleware/validateRequest'
import { USER_ROLES } from '../../../enum/user'
import { iapValidation } from './iap.validation'
import { IapController } from './iap.controller'

const router = express.Router()

// Route to verify a new Android or iOS purchase receipt
router.post(
  '/verify-receipt',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(iapValidation.verifyIapReceipt),
  IapController.verifyIapReceipt,
)

// Route to fetch active user IAP details
router.get(
  '/my-iap',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  IapController.getMyIapSubscription,
)

export const IapRoutes = router
