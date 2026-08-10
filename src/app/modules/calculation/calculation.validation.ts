import { z } from 'zod';

const loadDataValidationSchema = z.object({
  loadNumber: z.string().optional(),
  baseRate: z.number(),
  fuelSurcharge: z.number(),
  loadedMiles: z.number(),
  tolls: z.number(),
  dhMiles: z.number(),
  dhRate: z.number(),
  bonus: z.number(),
  driverPercentage: z.number(),
  totalRevenue: z.number(),
  totalProfit: z.number(),
  totalFSC: z.number(),
  totalDH: z.number(),
  totalMiles: z.number(),
  compensationPerMile: z.number(),
  costPerMile: z.number(),
  totalCost: z.number(),
  profitPerMile: z.number(),
  driverPay: z.number(),
  ownerPay: z.number(),
});

const goalDataValidationSchema = z.object({
  desiredWeeklyProfit: z.number(),
  costPerMile: z.number(),
  daysPerWeek: z.number(),
  maxMilesPerDay: z.number(),
  loadedMilesNeeded: z.number(),
  minTargetRate: z.number(),
  totalRevenue: z.number(),
  totalCost: z.number(),
  maxDHPerDay: z.number(),
  maxDHPerWeek: z.number(),
});

const costDataValidationSchema = z.object({
  insurance: z.number(),
  truckPayment: z.number(),
  escrow: z.number(),
  repairSavings: z.number(),
  driverPayFixed: z.number(),
  permits: z.number(),
  otherFixed: z.number(),
  milesPerWeek: z.number(),
  avgMPG: z.number(),
  fuelPrice: z.number(),
  oilChangesPerYear: z.number(),
  costPerOilChange: z.number(),
  tireCostPerYear: z.number(),
  maintenanceCostPerYear: z.number(),
  totalWeeklyFixed: z.number(),
  weeklyFuelCost: z.number(),
  weeklyOilChangeCost: z.number(),
  weeklyTireCost: z.number(),
  weeklyMaintenanceCost: z.number(),
  totalWeeklyVariable: z.number(),
  totalWeeklyOperatingCost: z.number(),
  trueCPM: z.number(),
});

const createCalculationValidationSchema = z.object({
  body: z.object({
    type: z.enum(['LOAD', 'GOAL', 'COST']),
    loadData: loadDataValidationSchema.optional(),
    goalData: goalDataValidationSchema.optional(),
    costData: costDataValidationSchema.optional(),
  }),
});

export const CalculationValidation = {
  createCalculationValidationSchema,
};
