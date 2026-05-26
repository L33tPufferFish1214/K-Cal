export type ThemeMode = 'light' | 'dark';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type FoodSource = 'manual' | 'barcode' | 'ocr' | 'quick-add' | 'history';
export type OilType = 'none' | 'olive' | 'vegetable';
export type OilUnit = 'tsp' | 'tbsp' | 'ml';

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  unsaturatedFat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export type NutritionKey = keyof Nutrition;

export interface MacroTarget extends Nutrition {}

export interface OilSelection {
  type: OilType;
  amount: number;
  unit: OilUnit;
}

export interface UserProfile {
  id: string;
  name: string;
  color: string;
  pinHash: string;
  pinSalt: string;
  dailyGoal: number;
  targets: MacroTarget;
  reminderTime: string;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FoodDraft {
  name: string;
  servingQuantity: number;
  servingUnit: string;
  nutrition: Nutrition;
  source: FoodSource;
  confidence?: ConfidenceLevel;
  barcode?: string;
  notes?: string;
}

export interface FoodLog extends FoodDraft {
  id: string;
  userId: string;
  loggedAt: string;
  createdAt: string;
  oil?: OilSelection;
  baseNutrition: Nutrition;
}

export interface CachedFood extends FoodDraft {
  id: string;
  userId: string;
  normalizedName: string;
  lastUsedAt: string;
  createdAt: string;
  timesLogged: number;
}

export interface AppPreference {
  key: string;
  value: string;
}

export interface DailySeriesPoint extends Nutrition {
  date: string;
}

