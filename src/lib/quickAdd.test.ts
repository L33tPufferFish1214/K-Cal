import { describe, expect, it } from 'vitest';
import { resolveQuickAddFromCommonFoods } from './quickAdd';

describe('quick add parser', () => {
  it('parses grams for a known staple', () => {
    const result = resolveQuickAddFromCommonFoods('200g white rice');
    expect(result.draft?.name).toBe('White rice, cooked');
    expect(result.draft?.nutrition.calories).toBe(260);
  });

  it('parses household units', () => {
    const result = resolveQuickAddFromCommonFoods('1 cup oats');
    expect(result.draft?.name).toBe('Rolled oats, dry');
    expect(result.draft?.nutrition.protein).toBeCloseTo(13.7, 1);
  });

  it('returns a useful fallback reason when no local food matches', () => {
    const result = resolveQuickAddFromCommonFoods('1 bowl mystery stew');
    expect(result.draft).toBeNull();
    expect(result.reason).toContain('No local match');
  });
});

