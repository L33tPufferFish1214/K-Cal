import type { Nutrition, OilSelection } from '../types';

export const EMPTY_NUTRITION: Nutrition = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  saturatedFat: 0,
  unsaturatedFat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0
};

export const OIL_PER_TABLESPOON: Record<Exclude<OilSelection['type'], 'none'>, Nutrition> = {
  olive: {
    calories: 119,
    protein: 0,
    carbs: 0,
    fat: 13.5,
    saturatedFat: 1.9,
    unsaturatedFat: 11.6,
    fiber: 0,
    sugar: 0,
    sodium: 0
  },
  vegetable: {
    calories: 120,
    protein: 0,
    carbs: 0,
    fat: 14,
    saturatedFat: 2,
    unsaturatedFat: 12,
    fiber: 0,
    sugar: 0,
    sodium: 0
  }
};

export const defaultTargets: Nutrition = {
  calories: 2000,
  protein: 140,
  carbs: 230,
  fat: 70,
  saturatedFat: 20,
  unsaturatedFat: 50,
  fiber: 30,
  sugar: 50,
  sodium: 2300
};

