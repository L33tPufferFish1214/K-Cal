import { commonFoods, type CommonFood } from '../data/commonFoods';
import type { FoodDraft } from '../types';
import { normalizeNutrition, scaleNutrition } from './nutrition';

export interface QuickAddParseResult {
  draft: FoodDraft | null;
  reason?: string;
  parsed?: {
    quantity: number;
    unit: string;
    foodName: string;
  };
}

const unitAliases: Record<string, string> = {
  gram: 'g',
  grams: 'g',
  g: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  ounce: 'oz',
  ounces: 'oz',
  oz: 'oz',
  cup: 'cup',
  cups: 'cup',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  egg: 'egg',
  eggs: 'egg',
  slice: 'slice',
  slices: 'slice',
  banana: 'banana',
  bananas: 'banana',
  apple: 'apple',
  apples: 'apple'
};

function findCommonFood(foodName: string): CommonFood | undefined {
  const normalized = foodName.toLowerCase().trim();
  return commonFoods.find((food) => food.aliases.some((alias) => normalized.includes(alias)));
}

function parseText(text: string): { quantity: number; unit: string; foodName: string } | null {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  const match = normalized.match(/^(\d+(?:\.\d+)?|\d+\/\d+)?\s*([a-z]+)?\s+(.+)$/i);
  if (!match) {
    return null;
  }

  let quantity = Number(match[1] ?? 1);
  if (match[1]?.includes('/')) {
    const [numerator, denominator] = match[1].split('/').map(Number);
    quantity = denominator ? numerator / denominator : 1;
  }

  return {
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    unit: unitAliases[match[2] ?? ''] ?? match[2] ?? '',
    foodName: match[3]
  };
}

function gramsFor(food: CommonFood, quantity: number, unit: string): number | null {
  if (!unit || unit === 'g') {
    return quantity;
  }
  if (unit === 'kg') {
    return quantity * 1000;
  }
  if (unit === 'oz') {
    return quantity * 28.35;
  }
  if (unit === 'ml') {
    return quantity;
  }

  const lookup = food.gramsPerUnit?.[unit] ?? food.gramsPerUnit?.[`${unit}s`];
  return lookup ? lookup * quantity : null;
}

export function resolveQuickAddFromCommonFoods(text: string): QuickAddParseResult {
  const parsed = parseText(text);
  if (!parsed) {
    return { draft: null, reason: 'Try a quantity, unit, and food name like "200g white rice".' };
  }

  const food = findCommonFood(parsed.foodName);
  if (!food) {
    return { draft: null, reason: 'No local match found.', parsed };
  }

  const grams = gramsFor(food, parsed.quantity, parsed.unit || food.defaultUnit);
  if (!grams) {
    return { draft: null, reason: `I know ${food.name}, but not that unit yet.`, parsed };
  }

  return {
    parsed,
    draft: {
      name: food.name,
      servingQuantity: parsed.quantity,
      servingUnit: parsed.unit || food.defaultUnit,
      nutrition: normalizeNutrition(scaleNutrition(food.nutritionPer100g, grams / 100)),
      source: 'quick-add',
      confidence: 'high'
    }
  };
}
