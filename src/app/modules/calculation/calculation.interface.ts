import { Types } from 'mongoose';

export type ICalculationType = 'LOAD' | 'GOAL' | 'COST';

export type ILoadCalculation = {
  loadNumber?: string;
  baseRate: number;
  fuelSurcharge: number;
  loadedMiles: number;
  tolls: number;
  dhMiles: number;
  dhRate: number;
  bonus: number;
  driverPercentage: number;
  totalRevenue: number;
  totalProfit: number;
  totalFSC: number;
  totalDH: number;
  totalMiles: number;
  compensationPerMile: number;
  costPerMile: number;
  totalCost: number;
  profitPerMile: number;
  driverPay: number;
  ownerPay: number;
};

export type IGoalCalculation = {
  desiredWeeklyProfit: number;
  costPerMile: number;
  daysPerWeek: number;
  maxMilesPerDay: number;
  loadedMilesNeeded: number;
  minTargetRate: number;
  totalRevenue: number;
  totalCost: number;
  maxDHPerDay: number;
  maxDHPerWeek: number;
};

export type ICostCalculation = {
  // Fixed Costs
  insurance: number;
  truckPayment: number;
  escrow: number;
  repairSavings: number;
  driverPayFixed: number;
  permits: number;
  otherFixed: number;
  // Variable Costs
  milesPerWeek: number;
  avgMPG: number;
  fuelPrice: number;
  oilChangesPerYear: number;
  costPerOilChange: number;
  tireCostPerYear: number;
  maintenanceCostPerYear: number;
  // Results
  totalWeeklyFixed: number;
  weeklyFuelCost: number;
  weeklyOilChangeCost: number;
  weeklyTireCost: number;
  weeklyMaintenanceCost: number;
  totalWeeklyVariable: number;
  totalWeeklyOperatingCost: number;
  trueCPM: number;
};

export type ICalculation = {
  user: Types.ObjectId;
  type: ICalculationType;
  loadData?: ILoadCalculation;
  goalData?: IGoalCalculation;
  costData?: ICostCalculation;
  createdAt?: Date;
  updatedAt?: Date;
};
