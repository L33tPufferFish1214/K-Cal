import type { ConfidenceLevel, FoodDraft, Nutrition } from '../types';
import { normalizeNutrition } from './nutrition';

export interface OcrResult {
  text: string;
  confidenceScore: number;
  confidence: ConfidenceLevel;
  draft: FoodDraft;
}

function extractNumber(text: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return Number(match[1].replace(',', '.'));
    }
  }
  return 0;
}

export function confidenceFromScore(score: number): ConfidenceLevel {
  if (score >= 80) {
    return 'high';
  }
  if (score >= 55) {
    return 'medium';
  }
  return 'low';
}

export function parseNutritionLabelText(text: string, confidenceScore = 0): FoodDraft {
  const clean = text.replace(/\s+/g, ' ').toLowerCase();
  const nutrition: Nutrition = normalizeNutrition({
    calories: extractNumber(clean, [/calories?\s+(\d+(?:[.,]\d+)?)/i, /energy\s+(\d+(?:[.,]\d+)?)\s*kcal/i]),
    protein: extractNumber(clean, [/protein\s+(\d+(?:[.,]\d+)?)\s*g/i]),
    carbs: extractNumber(clean, [/(?:total\s+)?carbohydrate[s]?\s+(\d+(?:[.,]\d+)?)\s*g/i, /\bcarbs?\s+(\d+(?:[.,]\d+)?)\s*g/i]),
    fat: extractNumber(clean, [/(?:total\s+)?fat\s+(\d+(?:[.,]\d+)?)\s*g/i]),
    saturatedFat: extractNumber(clean, [/saturated\s+fat\s+(\d+(?:[.,]\d+)?)\s*g/i, /sat\.?\s+fat\s+(\d+(?:[.,]\d+)?)\s*g/i]),
    fiber: extractNumber(clean, [/fiber\s+(\d+(?:[.,]\d+)?)\s*g/i, /fibre\s+(\d+(?:[.,]\d+)?)\s*g/i]),
    sugar: extractNumber(clean, [/sugars?\s+(\d+(?:[.,]\d+)?)\s*g/i]),
    sodium: extractNumber(clean, [/sodium\s+(\d+(?:[.,]\d+)?)\s*mg/i])
  });

  nutrition.unsaturatedFat = Math.max(0, nutrition.fat - nutrition.saturatedFat);

  const servingMatch = clean.match(/serving\s+size\s+([^.;,\n]+)/i);
  return {
    name: 'Scanned nutrition label',
    servingQuantity: 1,
    servingUnit: servingMatch?.[1]?.trim() || 'serving',
    nutrition: normalizeNutrition(nutrition),
    source: 'ocr',
    confidence: confidenceFromScore(confidenceScore)
  };
}

export async function recognizeNutritionLabel(image: File | Blob, onProgress?: (progress: number) => void): Promise<OcrResult> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text') {
        onProgress?.(message.progress);
      }
    }
  });

  try {
    const { data } = await worker.recognize(image);
    const score = Number(data.confidence ?? 0);
    const draft = parseNutritionLabelText(data.text, score);
    return {
      text: data.text,
      confidenceScore: score,
      confidence: confidenceFromScore(score),
      draft
    };
  } finally {
    await worker.terminate();
  }
}

