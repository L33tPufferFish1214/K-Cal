import type { Nutrition } from '../types';

export interface CommonFood {
  id: string;
  name: string;
  aliases: string[];
  nutritionPer100g: Nutrition;
  defaultUnit: string;
  gramsPerUnit?: Record<string, number>;
}

export const commonFoods: CommonFood[] = [
  {
    id: 'white-rice-cooked',
    name: 'White rice, cooked',
    aliases: ['white rice', 'rice', 'cooked rice'],
    defaultUnit: 'g',
    nutritionPer100g: {
      calories: 130,
      protein: 2.7,
      carbs: 28.2,
      fat: 0.3,
      saturatedFat: 0.1,
      unsaturatedFat: 0.2,
      fiber: 0.4,
      sugar: 0.1,
      sodium: 1
    },
    gramsPerUnit: { cup: 158, cups: 158 }
  },
  {
    id: 'rolled-oats',
    name: 'Rolled oats, dry',
    aliases: ['oats', 'rolled oats', 'oatmeal dry'],
    defaultUnit: 'g',
    nutritionPer100g: {
      calories: 389,
      protein: 16.9,
      carbs: 66.3,
      fat: 6.9,
      saturatedFat: 1.2,
      unsaturatedFat: 5.7,
      fiber: 10.6,
      sugar: 0.9,
      sodium: 2
    },
    gramsPerUnit: { cup: 81, cups: 81 }
  },
  {
    id: 'egg-large',
    name: 'Large egg',
    aliases: ['egg', 'eggs', 'large egg'],
    defaultUnit: 'egg',
    nutritionPer100g: {
      calories: 143,
      protein: 12.6,
      carbs: 0.7,
      fat: 9.5,
      saturatedFat: 3.1,
      unsaturatedFat: 6.4,
      fiber: 0,
      sugar: 0.4,
      sodium: 142
    },
    gramsPerUnit: { egg: 50, eggs: 50, unit: 50, units: 50 }
  },
  {
    id: 'chicken-breast-cooked',
    name: 'Chicken breast, cooked',
    aliases: ['chicken breast', 'chicken', 'grilled chicken'],
    defaultUnit: 'g',
    nutritionPer100g: {
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      saturatedFat: 1,
      unsaturatedFat: 2.6,
      fiber: 0,
      sugar: 0,
      sodium: 74
    },
    gramsPerUnit: { oz: 28.35, ounce: 28.35, ounces: 28.35 }
  },
  {
    id: 'banana',
    name: 'Banana',
    aliases: ['banana', 'bananas'],
    defaultUnit: 'banana',
    nutritionPer100g: {
      calories: 89,
      protein: 1.1,
      carbs: 22.8,
      fat: 0.3,
      saturatedFat: 0.1,
      unsaturatedFat: 0.2,
      fiber: 2.6,
      sugar: 12.2,
      sodium: 1
    },
    gramsPerUnit: { banana: 118, bananas: 118, unit: 118, units: 118 }
  },
  {
    id: 'apple',
    name: 'Apple',
    aliases: ['apple', 'apples'],
    defaultUnit: 'apple',
    nutritionPer100g: {
      calories: 52,
      protein: 0.3,
      carbs: 13.8,
      fat: 0.2,
      saturatedFat: 0,
      unsaturatedFat: 0.2,
      fiber: 2.4,
      sugar: 10.4,
      sodium: 1
    },
    gramsPerUnit: { apple: 182, apples: 182, unit: 182, units: 182 }
  },
  {
    id: 'whole-milk',
    name: 'Whole milk',
    aliases: ['milk', 'whole milk'],
    defaultUnit: 'ml',
    nutritionPer100g: {
      calories: 61,
      protein: 3.2,
      carbs: 4.8,
      fat: 3.3,
      saturatedFat: 1.9,
      unsaturatedFat: 1.4,
      fiber: 0,
      sugar: 5.1,
      sodium: 43
    },
    gramsPerUnit: { cup: 244, cups: 244, ml: 1, tbsp: 15, tsp: 5 }
  },
  {
    id: 'whole-wheat-bread',
    name: 'Whole wheat bread',
    aliases: ['bread', 'whole wheat bread', 'toast'],
    defaultUnit: 'slice',
    nutritionPer100g: {
      calories: 247,
      protein: 13,
      carbs: 41,
      fat: 4.2,
      saturatedFat: 0.9,
      unsaturatedFat: 3.3,
      fiber: 7,
      sugar: 6,
      sodium: 400
    },
    gramsPerUnit: { slice: 32, slices: 32 }
  },
  {
    id: 'peanut-butter',
    name: 'Peanut butter',
    aliases: ['peanut butter', 'pb'],
    defaultUnit: 'tbsp',
    nutritionPer100g: {
      calories: 588,
      protein: 25,
      carbs: 20,
      fat: 50,
      saturatedFat: 10,
      unsaturatedFat: 40,
      fiber: 6,
      sugar: 9,
      sodium: 459
    },
    gramsPerUnit: { tbsp: 16, tablespoon: 16, tablespoons: 16, tsp: 5.3 }
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    aliases: ['broccoli'],
    defaultUnit: 'g',
    nutritionPer100g: {
      calories: 35,
      protein: 2.4,
      carbs: 7.2,
      fat: 0.4,
      saturatedFat: 0.1,
      unsaturatedFat: 0.3,
      fiber: 3.3,
      sugar: 1.4,
      sodium: 41
    },
    gramsPerUnit: { cup: 91, cups: 91 }
  }
];

