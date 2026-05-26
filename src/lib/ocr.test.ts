import { describe, expect, it } from 'vitest';
import { confidenceFromScore, parseNutritionLabelText } from './ocr';

describe('nutrition label OCR parsing', () => {
  it('extracts common nutrition facts', () => {
    const draft = parseNutritionLabelText(
      'Serving size 1 cup Calories 250 Total Fat 8g Saturated Fat 2g Sodium 430mg Total Carbohydrate 31g Dietary Fiber 4g Total Sugars 6g Protein 11g',
      88
    );

    expect(draft.confidence).toBe('high');
    expect(draft.nutrition.calories).toBe(250);
    expect(draft.nutrition.unsaturatedFat).toBe(6);
    expect(draft.nutrition.sodium).toBe(430);
  });

  it('buckets confidence scores', () => {
    expect(confidenceFromScore(90)).toBe('high');
    expect(confidenceFromScore(60)).toBe('medium');
    expect(confidenceFromScore(30)).toBe('low');
  });
});

