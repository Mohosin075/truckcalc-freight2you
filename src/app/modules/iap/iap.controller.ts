import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { IapServiceInstance } from './iap.service'
import { JwtPayload } from 'jsonwebtoken'

const verifyIapReceipt = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const userId = user.authId!.toString()
  const result = await IapServiceInstance.verifyIapReceipt(userId, req.body)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result.subscription,
  })
})

const getMyIapSubscription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const userId = user.authId!.toString()
  const result = await IapServiceInstance.getMyIapSubscription(userId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User IAP subscription details retrieved successfully',
    data: result,
  })
})

export const IapController = {
  verifyIapReceipt,
  getMyIapSubscription,
}
