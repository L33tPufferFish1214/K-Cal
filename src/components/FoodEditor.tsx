import { useMemo, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { EMPTY_NUTRITION } from '../data/oils';
import type { FoodDraft, NutritionKey, OilSelection, OilType, OilUnit } from '../types';
import { macroMeta, nutritionKeys, nutritionWithOil, roundNutrition } from '../lib/nutrition';

interface FoodEditorProps {
  title: string;
  initialDraft?: FoodDraft;
  saveLabel?: string;
  onCancel?: () => void;
  onSave: (draft: FoodDraft, oil: OilSelection) => Promise<void> | void;
}

const emptyDraft: FoodDraft = {
  name: '',
  servingQuantity: 1,
  servingUnit: 'serving',
  nutrition: { ...EMPTY_NUTRITION },
  source: 'manual',
  confidence: 'high'
};

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function FoodEditor({ title, initialDraft, saveLabel = 'Log food', onCancel, onSave }: FoodEditorProps) {
  const [draft, setDraft] = useState<FoodDraft>(initialDraft ?? emptyDraft);
  const [oilType, setOilType] = useState<OilType>('none');
  const [oilAmount, setOilAmount] = useState(1);
  const [oilUnit, setOilUnit] = useState<OilUnit>('tsp');
  const [busy, setBusy] = useState(false);

  const oil: OilSelection = { type: oilType, amount: oilType === 'none' ? 0 : oilAmount, unit: oilUnit };
  const preview = useMemo(() => nutritionWithOil(draft.nutrition, oil), [draft.nutrition, oil]);

  function setNutrition(key: NutritionKey, value: string) {
    setDraft((current) => ({
      ...current,
      nutrition: {
        ...current.nutrition,
        [key]: toNumber(value)
      }
    }));
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      return;
    }
    setBusy(true);
    await onSave(
      {
        ...draft,
        name: draft.name.trim(),
        servingQuantity: Number(draft.servingQuantity) || 1,
        servingUnit: draft.servingUnit.trim() || 'serving'
      },
      oil
    );
    setBusy(false);
    if (!initialDraft) {
      setDraft(emptyDraft);
      setOilType('none');
    }
  }

  return (
    <section className="surface editor-surface">
      <div className="section-heading">
        <h2>{title}</h2>
        {draft.confidence ? <span className={`confidence ${draft.confidence}`}>{draft.confidence}</span> : null}
      </div>

      <div className="field-grid">
        <label className="field span-2">
          <span>Food</span>
          <input onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} value={draft.name} />
        </label>
        <label className="field">
          <span>Serving</span>
          <input
            min={0}
            onChange={(event) => setDraft((current) => ({ ...current, servingQuantity: toNumber(event.target.value) }))}
            type="number"
            value={draft.servingQuantity}
          />
        </label>
        <label className="field">
          <span>Unit</span>
          <input onChange={(event) => setDraft((current) => ({ ...current, servingUnit: event.target.value }))} value={draft.servingUnit} />
        </label>
      </div>

      <div className="macro-input-grid">
        {nutritionKeys.map((key) => (
          <label className="field compact-field" key={key}>
            <span>
              {macroMeta[key].label} <small>{macroMeta[key].unit}</small>
            </span>
            <input min={0} onChange={(event) => setNutrition(key, event.target.value)} step="0.1" type="number" value={draft.nutrition[key]} />
          </label>
        ))}
      </div>

      <div className="oil-box">
        <div className="section-heading tight">
          <h3>Did you use oil?</h3>
          <span className="muted">{roundNutrition(preview.calories)} kcal total</span>
        </div>
        <div className="segmented">
          {(['none', 'olive', 'vegetable'] as OilType[]).map((type) => (
            <button className={oilType === type ? 'is-active' : ''} key={type} onClick={() => setOilType(type)} type="button">
              {type === 'none' ? 'None' : type === 'olive' ? 'Olive' : 'Vegetable'}
            </button>
          ))}
        </div>
        {oilType !== 'none' ? (
          <div className="oil-controls">
            <label className="field compact-field">
              <span>Amount</span>
              <input min={0} onChange={(event) => setOilAmount(toNumber(event.target.value))} step="0.25" type="number" value={oilAmount} />
            </label>
            <label className="field compact-field">
              <span>Unit</span>
              <select onChange={(event) => setOilUnit(event.target.value as OilUnit)} value={oilUnit}>
                <option value="tsp">tsp</option>
                <option value="tbsp">tbsp</option>
                <option value="ml">ml</option>
              </select>
            </label>
          </div>
        ) : null}
      </div>

      <div className="action-row">
        <button className="primary-button" disabled={busy || !draft.name.trim()} onClick={handleSave} type="button">
          <Check size={18} />
          {saveLabel}
        </button>
        {onCancel ? (
          <button className="ghost-button" onClick={onCancel} type="button">
            <RotateCcw size={18} />
            Cancel
          </button>
        ) : null}
      </div>
    </section>
  );
}

