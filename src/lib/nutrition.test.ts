import { describe, expect, it } from 'vitest';
import { EMPTY_NUTRITION } from '../data/oils';
import type { FoodLog } from '../types';
import { addNutrition, buildAlerts, dailySeries, nutritionWithOil, totalForRange, weekRange } from './nutrition';

function log(id: string, loggedAt: string, calories: number): FoodLog {
  return {
    id,
    userId: 'user_1',
    name: `Food ${id}`,
    servingQuantity: 1,
    servingUnit: 'serving',
    source: 'manual',
    nutrition: { ...EMPTY_NUTRITION, calories },
    baseNutrition: { ...EMPTY_NUTRITION, calories },
    loggedAt,
    createdAt: loggedAt
  };
}

describe('nutrition math', () => {
  it('adds olive oil to a base food', () => {
    const total = nutritionWithOil({ ...EMPTY_NUTRITION, calories: 100, fat: 2 }, { type: 'olive', amount: 1, unit: 'tbsp' });
    expect(total.calories).toBe(219);
    expect(total.fat).toBe(15.5);
    expect(total.saturatedFat).toBe(1.9);
  });

  it('totals daily and weekly calories without rolling daily calories forward', () => {
    const now = new Date('2026-05-20T12:00:00');
    const logs = [log('a', '2026-05-19T18:00:00.000Z', 500), log('b', '2026-05-20T18:00:00.000Z', 900)];
    const daily = totalForRange(logs, new Date('2026-05-20T00:00:00.000Z'), new Date('2026-05-20T23:59:59.999Z'));
    const weekly = totalForRange(logs, weekRange(now).start, weekRange(now).end);

    expect(daily.calories).toBe(900);
    expect(weekly.calories).toBe(1400);
  });

  it('builds alert thresholds for limit macros', () => {
    const alerts = buildAlerts(
      addNutrition({ ...EMPTY_NUTRITION, calories: 1700, sodium: 2400 }),
      { ...EMPTY_NUTRITION, calories: 2000, sodium: 2300 }
    );

    expect(alerts.map((alert) => alert.level)).toEqual(['warning', 'danger']);
  });

  it('builds a fixed 7-day chart series', () => {
    const series = dailySeries([log('a', '2026-05-20T18:00:00.000Z', 500)], 7, new Date('2026-05-20T20:00:00.000Z'));
    expect(series).toHaveLength(7);
    expect(series.at(-1)?.calories).toBe(500);
  });
});

