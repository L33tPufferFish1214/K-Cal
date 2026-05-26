import type { FoodDraft, Nutrition } from '../types';
import { normalizeNutrition, scaleNutrition } from './nutrition';

interface OpenFoodFactsProduct {
  code?: string;
  product_name?: string;
  generic_name?: string;
  brands?: string;
  serving_quantity?: string | number;
  serving_size?: string;
  image_front_small_url?: string;
  nutriments?: Record<string, number | string | undefined>;
}

interface ProductResponse {
  status?: number;
  product?: OpenFoodFactsProduct;
}

interface SearchResponse {
  products?: OpenFoodFactsProduct[];
}

const fields = [
  'code',
  'product_name',
  'generic_name',
  'brands',
  'serving_quantity',
  'serving_size',
  'image_front_small_url',
  'nutriments'
].join(',');

function numeric(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readNutrient(nutriments: Record<string, unknown>, base: string, suffix: 'serving' | '100g'): number {
  return numeric(nutriments[`${base}_${suffix}`]);
}

function nutritionFromNutriments(product: OpenFoodFactsProduct): { nutrition: Nutrition; servingQuantity: number; servingUnit: string } {
  const nutriments = product.nutriments ?? {};
  const servingQuantity = numeric(product.serving_quantity) || 100;
  const hasServing = readNutrient(nutriments, 'energy-kcal', 'serving') > 0 || readNutrient(nutriments, 'proteins', 'serving') > 0;
  const suffix = hasServing ? 'serving' : '100g';

  const sodiumInGrams = readNutrient(nutriments, 'sodium', suffix);
  const nutrition = normalizeNutrition({
    calories: readNutrient(nutriments, 'energy-kcal', suffix),
    protein: readNutrient(nutriments, 'proteins', suffix),
    carbs: readNutrient(nutriments, 'carbohydrates', suffix),
    fat: readNutrient(nutriments, 'fat', suffix),
    saturatedFat: readNutrient(nutriments, 'saturated-fat', suffix),
    unsaturatedFat: Math.max(0, readNutrient(nutriments, 'fat', suffix) - readNutrient(nutriments, 'saturated-fat', suffix)),
    fiber: readNutrient(nutriments, 'fiber', suffix),
    sugar: readNutrient(nutriments, 'sugars', suffix),
    sodium: sodiumInGrams * 1000
  });

  return {
    nutrition: hasServing ? nutrition : scaleNutrition(nutrition, servingQuantity / 100),
    servingQuantity,
    servingUnit: product.serving_size || (hasServing ? 'serving' : 'g')
  };
}

export function normalizeOpenFoodProduct(product: OpenFoodFactsProduct, source: 'barcode' | 'quick-add' = 'barcode'): FoodDraft {
  const { nutrition, servingQuantity, servingUnit } = nutritionFromNutriments(product);
  const brand = product.brands?.split(',')[0]?.trim();
  const name = [brand, product.product_name || product.generic_name || 'Open Food Facts item'].filter(Boolean).join(' ');

  return {
    name,
    servingQuantity,
    servingUnit,
    nutrition,
    source,
    confidence: 'medium',
    barcode: product.code
  };
}

export async function lookupBarcode(barcode: string): Promise<FoodDraft | null> {
  const clean = barcode.replace(/\D/g, '');
  if (!clean) {
    return null;
  }

  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=${fields}`);
  if (!response.ok) {
    throw new Error('Open Food Facts lookup failed.');
  }

  const data = (await response.json()) as ProductResponse;
  if (data.status !== 1 || !data.product) {
    return null;
  }

  return normalizeOpenFoodProduct(data.product, 'barcode');
}

export async function searchOpenFoodFacts(query: string): Promise<FoodDraft[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '5',
    fields
  });

  const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`);
  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as SearchResponse;
  return (data.products ?? [])
    .filter((product) => product.nutriments)
    .map((product) => normalizeOpenFoodProduct(product, 'quick-add'))
    .filter((draft) => draft.nutrition.calories > 0);
}

