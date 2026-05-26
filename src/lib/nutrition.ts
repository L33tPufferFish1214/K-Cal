import {
  addDays,
  eachDayOfInterval,
  endOfDay,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfWeek,
  subDays
} from 'date-fns';
import { EMPTY_NUTRITION, OIL_PER_TABLESPOON } from '../data/oils';
import type { DailySeriesPoint, FoodLog, MacroTarget, Nutrition, NutritionKey, OilSelection } from '../types';

export const nutritionKeys: NutritionKey[] = [
  'calories',
  'protein',
  'carbs',
  'fat',
  'saturatedFat',
  'unsaturatedFat',
  'fiber',
  'sugar',
  'sodium'
];

export const macroMeta: Record<NutritionKey, { label: string; unit: string; kind: 'limit' | 'goal' }> = {
  calories: { label: 'Calories', unit: 'kcal', kind: 'limit' },
  protein: { label: 'Protein', unit: 'g', kind: 'goal' },
  carbs: { label: 'Carbs', unit: 'g', kind: 'limit' },
  fat: { label: 'Fat', unit: 'g', kind: 'limit' },
  saturatedFat: { label: 'Saturated fat', unit: 'g', kind: 'limit' },
  unsaturatedFat: { label: 'Unsaturated fat', unit: 'g', kind: 'goal' },
  fiber: { label: 'Fiber', unit: 'g', kind: 'goal' },
  sugar: { label: 'Sugar', unit: 'g', kind: 'limit' },
  sodium: { label: 'Sodium', unit: 'mg', kind: 'limit' }
};

export function roundNutrition(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 10) / 10;
}

export function normalizeNutrition(input: Partial<Nutrition>): Nutrition {
  return nutritionKeys.reduce<Nutrition>((next, key) => {
    next[key] = roundNutrition(Math.max(0, Number(input[key] ?? 0)));
    return next;
  }, { ...EMPTY_NUTRITION });
}

export function addNutrition(...items: Partial<Nutrition>[]): Nutrition {
  const total = { ...EMPTY_NUTRITION };
  for (const item of items) {
    for (const key of nutritionKeys) {
      total[key] += Number(item[key] ?? 0);
    }
  }
  return normalizeNutrition(total);
}

export function scaleNutrition(nutrition: Nutrition, factor: number): Nutrition {
  return normalizeNutrition(
    nutritionKeys.reduce<Partial<Nutrition>>((next, key) => {
      next[key] = nutrition[key] * factor;
      return next;
    }, {})
  );
}

export function oilToNutrition(oil?: OilSelection): Nutrition {
  if (!oil || oil.type === 'none' || oil.amount <= 0) {
    return { ...EMPTY_NUTRITION };
  }

  const perTablespoon = OIL_PER_TABLESPOON[oil.type];
  const tablespoons = oil.unit === 'tbsp' ? oil.amount : oil.unit === 'tsp' ? oil.amount / 3 : oil.amount / 14.7868;
  return scaleNutrition(perTablespoon, tablespoons);
}

export function nutritionWithOil(base: Nutrition, oil?: OilSelection): Nutrition {
  return addNutrition(base, oilToNutrition(oil));
}

export function todayRange(now = new Date()): { start: Date; end: Date } {
  return { start: startOfDay(now), end: endOfDay(now) };
}

export function weekRange(now = new Date()): { start: Date; end: Date } {
  const start = startOfWeek(now, { weekStartsOn: 1 });
  return { start, end: endOfDay(addDays(start, 6)) };
}

export function logsInRange(logs: FoodLog[], start: Date, end: Date): FoodLog[] {
  return logs.filter((log) => isWithinInterval(parseISO(log.loggedAt), { start, end }));
}

export function totalNutrition(logs: FoodLog[]): Nutrition {
  return addNutrition(...logs.map((log) => log.nutrition));
}

export function totalForRange(logs: FoodLog[], start: Date, end: Date): Nutrition {
  return totalNutrition(logsInRange(logs, start, end));
}

export function lastThirtyDays(logs: FoodLog[], now = new Date()): FoodLog[] {
  return logsInRange(logs, startOfDay(subDays(now, 29)), endOfDay(now));
}

export function dailySeries(logs: FoodLog[], days: number, now = new Date()): DailySeriesPoint[] {
  const start = startOfDay(subDays(now, days - 1));
  const end = endOfDay(now);
  return eachDayOfInterval({ start, end }).map((day) => {
    const dayTotal = totalForRange(logs, startOfDay(day), endOfDay(day));
    return {
      date: format(day, 'MMM d'),
      ...dayTotal
    };
  });
}

export function macroPercent(total: number, target: number): number {
  if (!target) {
    return 0;
  }
  return Math.min(999, Math.round((total / target) * 100));
}

export function buildAlerts(totals: Nutrition, targets: MacroTarget): Array<{ key: NutritionKey; message: string; level: 'warning' | 'danger' }> {
  const alerts: Array<{ key: NutritionKey; message: string; level: 'warning' | 'danger' }> = [];

  for (const key of nutritionKeys.filter((candidate) => targets[candidate] > 0 && macroMeta[candidate].kind === 'limit')) {
      const percent = macroPercent(totals[key], targets[key]);
      if (percent >= 100) {
      alerts.push({ key, level: 'danger', message: `${macroMeta[key].label} limit exceeded` });
      continue;
      }
      if (percent >= 85) {
      alerts.push({ key, level: 'warning', message: `${macroMeta[key].label} is approaching the limit` });
      }
  }

  return alerts;
}
