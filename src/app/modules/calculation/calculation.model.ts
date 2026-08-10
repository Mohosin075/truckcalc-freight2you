import { Schema, model } from 'mongoose';
import { ICalculation } from './calculation.interface';

const loadDataSchema = new Schema({
  loadNumber: { type: String, required: false },
  baseRate: { type: Number, required: true },
  fuelSurcharge: { type: Number, required: true },
  loadedMiles: { type: Number, required: true },
  tolls: { type: Number, required: true },
  dhMiles: { type: Number, required: true },
  dhRate: { type: Number, required: true },
  bonus: { type: Number, required: true },
  driverPercentage: { type: Number, required: true },
  totalRevenue: { type: Number, required: true },
  totalProfit: { type: Number, required: true },
  totalFSC: { type: Number, required: true },
  totalDH: { type: Number, required: true },
  totalMiles: { type: Number, required: true },
  compensationPerMile: { type: Number, required: true },
  costPerMile: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  profitPerMile: { type: Number, required: true },
  driverPay: { type: Number, required: true },
  ownerPay: { type: Number, required: true },
}, { _id: false });

const goalDataSchema = new Schema({
  desiredWeeklyProfit: { type: Number, required: true },
  costPerMile: { type: Number, required: true },
  daysPerWeek: { type: Number, required: true },
  maxMilesPerDay: { type: Number, required: true },
  loadedMilesNeeded: { type: Number, required: true },
  minTargetRate: { type: Number, required: true },
  totalRevenue: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  maxDHPerDay: { type: Number, required: true },
  maxDHPerWeek: { type: Number, required: true },
}, { _id: false });

const costDataSchema = new Schema({
  insurance: { type: Number, required: true },
  truckPayment: { type: Number, required: true },
  escrow: { type: Number, required: true },
  repairSavings: { type: Number, required: true },
  driverPayFixed: { type: Number, required: true },
  permits: { type: Number, required: true },
  otherFixed: { type: Number, required: true },
  milesPerWeek: { type: Number, required: true },
  avgMPG: { type: Number, required: true },
  fuelPrice: { type: Number, required: true },
  oilChangesPerYear: { type: Number, required: true },
  costPerOilChange: { type: Number, required: true },
  tireCostPerYear: { type: Number, required: true },
  maintenanceCostPerYear: { type: Number, required: true },
  totalWeeklyFixed: { type: Number, required: true },
  weeklyFuelCost: { type: Number, required: true },
  weeklyOilChangeCost: { type: Number, required: true },
  weeklyTireCost: { type: Number, required: true },
  weeklyMaintenanceCost: { type: Number, required: true },
  totalWeeklyVariable: { type: Number, required: true },
  totalWeeklyOperatingCost: { type: Number, required: true },
  trueCPM: { type: Number, required: true },
}, { _id: false });

const calculationSchema = new Schema<ICalculation>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['LOAD', 'GOAL', 'COST'],
      required: true,
    },
    loadData: {
      type: loadDataSchema,
      required: false,
    },
    goalData: {
      type: goalDataSchema,
      required: false,
    },
    costData: {
      type: costDataSchema,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Calculation = model<ICalculation>('Calculation', calculationSchema);
