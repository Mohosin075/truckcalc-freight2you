import { Request, Response } from 'express';
import httpStatus from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { CalculationService } from './calculation.service';
import { Types } from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';

const createCalculation = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = new Types.ObjectId(user.authId);
  const result = await CalculationService.createCalculationIntoDB(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Calculation saved successfully',
    data: result,
  });
});

const getCalculations = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = new Types.ObjectId(user.authId);
  const result = await CalculationService.getCalculationsFromDB(userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Calculations retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const deleteCalculation = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = new Types.ObjectId(user.authId);
  const { id } = req.params;
  await CalculationService.deleteCalculationFromDB(userId, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Calculation deleted successfully',
    data: null,
  });
});

const getSingleCalculation = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = new Types.ObjectId(user.authId);
  const { id } = req.params;
  const result = await CalculationService.getSingleCalculationFromDB(userId, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Calculation retrieved successfully',
    data: result,
  });
});

const getStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = new Types.ObjectId(user.authId);
  const result = await CalculationService.getStatsFromDB(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stats retrieved successfully',
    data: result,
  });
});

const getExportData = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = new Types.ObjectId(user.authId);
  const result = await CalculationService.getExportDataFromDB(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Export data retrieved successfully',
    data: result,
  });
});

export const CalculationController = {
  createCalculation,
  getCalculations,
  deleteCalculation,
  getSingleCalculation,
  getStats,
  getExportData,
};
