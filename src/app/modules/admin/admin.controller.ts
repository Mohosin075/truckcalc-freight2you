import { Request, Response } from 'express';
import httpStatus from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AdminService } from './admin.service';

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getDashboardStats();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllUsers(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getSubscriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getSubscriptions(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscriptions retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getSubscriptionPlans = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getSubscriptionPlans();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plans retrieved successfully',
    data: result,
  });
});


const getAnalytics = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAnalytics();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Analytics data retrieved successfully',
    data: result,
  });
});

export const AdminController = {
  getAnalytics,
  getDashboardStats,
  getAllUsers,
  getSubscriptions,
  getSubscriptionPlans,
};
