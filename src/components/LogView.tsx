import { useState } from 'react';
import { Clock3, Search, Sparkles } from 'lucide-react';
import type { CachedFood, FoodDraft, FoodLog, OilSelection } from '../types';
import { searchOpenFoodFacts } from '../lib/openFoodFacts';
import { resolveQuickAddFromCommonFoods } from '../lib/quickAdd';
import { FoodEditor } from './FoodEditor';

interface LogViewProps {
  recentFoods: CachedFood[];
  logs: FoodLog[];
  onSave: (draft: FoodDraft, oil: OilSelection) => Promise<void>;
}

type LogTab = 'manual' | 'quick' | 'recent';

const manualDraft: FoodDraft = {
  name: '',
  servingQuantity: 1,
  servingUnit: 'serving',
  nutrition: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    saturatedFat: 0,
    unsaturatedFat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  },
  source: 'manual',
  confidence: 'high'
};

export function LogView({ recentFoods, logs, onSave }: LogViewProps) {
  const [tab, setTab] = useState<LogTab>('manual');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<FoodDraft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<FoodDraft | null>(null);

  async function handleQuickAdd() {
    setBusy(true);
    setMessage('');
    setDrafts([]);
    const local = resolveQuickAddFromCommonFoods(query);

    if (local.draft) {
      setSelectedDraft(local.draft);
      setBusy(false);
      return;
    }

    try {
      const remote = await searchOpenFoodFacts(query);
      if (remote.length) {
        setDrafts(remote);
      } else {
        setMessage(local.reason ?? 'No match found.');
      }
    } catch {
      setMessage(local.reason ?? 'Lookup failed.');
    } finally {
      setBusy(false);
    }
  }

  function draftFromCached(food: CachedFood): FoodDraft {
    return {
      name: food.name,
      servingQuantity: food.servingQuantity,
      servingUnit: food.servingUnit,
      nutrition: food.nutrition,
      source: 'history',
      confidence: food.confidence,
      barcode: food.barcode,
      notes: food.notes
    };
  }

  function draftFromLog(log: FoodLog): FoodDraft {
    return {
      name: log.name,
      servingQuantity: log.servingQuantity,
      servingUnit: log.servingUnit,
      nutrition: log.baseNutrition,
      source: 'history',
      confidence: log.confidence,
      barcode: log.barcode,
      notes: log.notes
    };
  }

  return (
    <div className="screen stack">
      <div className="segmented nav-segment">
        <button className={tab === 'manual' ? 'is-active' : ''} onClick={() => setTab('manual')} type="button">
          Manual
        </button>
        <button className={tab === 'quick' ? 'is-active' : ''} onClick={() => setTab('quick')} type="button">
          Quick Add
        </button>
        <button className={tab === 'recent' ? 'is-active' : ''} onClick={() => setTab('recent')} type="button">
          History
        </button>
      </div>

      {selectedDraft ? (
        <FoodEditor initialDraft={selectedDraft} onCancel={() => setSelectedDraft(null)} onSave={onSave} title="Review food" />
      ) : null}

      {tab === 'manual' && !selectedDraft ? <FoodEditor initialDraft={manualDraft} onSave={onSave} title="Manual entry" /> : null}

      {tab === 'quick' && !selectedDraft ? (
        <section className="surface stack">
          <div className="section-heading">
            <h2>Quick Add</h2>
            <Sparkles size={20} />
          </div>
          <div className="search-row">
            <input
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleQuickAdd();
                }
              }}
              placeholder="200g white rice"
              value={query}
            />
            <button className="icon-button" disabled={busy || !query.trim()} onClick={handleQuickAdd} title="Search" type="button">
              <Search size={20} />
            </button>
          </div>

          {message ? <p className="empty-state">{message}</p> : null}
          <div className="choice-list">
            {drafts.map((draft) => (
              <button className="choice-row" key={`${draft.name}-${draft.barcode ?? draft.servingUnit}`} onClick={() => setSelectedDraft(draft)} type="button">
                <span>
                  <strong>{draft.name}</strong>
                  <small>{draft.servingQuantity} {draft.servingUnit}</small>
                </span>
                <b>{Math.round(draft.nutrition.calories)} kcal</b>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {tab === 'recent' && !selectedDraft ? (
        <section className="surface stack">
          <div className="section-heading">
            <h2>Last 30 days</h2>
            <Clock3 size={20} />
          </div>
          <div className="choice-list">
            {recentFoods.map((food) => (
              <button className="choice-row" key={food.id} onClick={() => setSelectedDraft(draftFromCached(food))} type="button">
                <span>
                  <strong>{food.name}</strong>
                  <small>{food.timesLogged} logs</small>
                </span>
                <b>{Math.round(food.nutrition.calories)} kcal</b>
              </button>
            ))}
            {logs.slice(0, 12).map((log) => (
              <button className="choice-row subtle-choice" key={log.id} onClick={() => setSelectedDraft(draftFromLog(log))} type="button">
                <span>
                  <strong>{log.name}</strong>
                  <small>{new Date(log.loggedAt).toLocaleDateString()}</small>
                </span>
                <b>{Math.round(log.nutrition.calories)} kcal</b>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

