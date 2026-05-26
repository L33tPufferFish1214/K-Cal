import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarDays, RotateCcw, Trash2 } from 'lucide-react';
import type { FoodDraft, FoodLog, OilSelection, UserProfile } from '../types';
import { dailySeries, totalForRange, weekRange } from '../lib/nutrition';

interface HistoryViewProps {
  profile: UserProfile;
  logs: FoodLog[];
  onDelete: (id: string) => Promise<void>;
  onSave: (draft: FoodDraft, oil: OilSelection) => Promise<void>;
}

export function HistoryView({ profile, logs, onDelete, onSave }: HistoryViewProps) {
  const seven = dailySeries(logs, 7);
  const thirty = dailySeries(logs, 30);
  const week = weekRange();
  const weekTotal = totalForRange(logs, week.start, week.end).calories;
  const weeklyBudget = profile.dailyGoal * 7;

  function readd(log: FoodLog) {
    const draft: FoodDraft = {
      name: log.name,
      servingQuantity: log.servingQuantity,
      servingUnit: log.servingUnit,
      nutrition: log.baseNutrition,
      source: 'history',
      confidence: log.confidence,
      barcode: log.barcode,
      notes: log.notes
    };
    void onSave(draft, { type: 'none', amount: 0, unit: 'tsp' });
  }

  return (
    <div className="screen stack">
      <section className="weekly-band">
        <div>
          <span className="eyebrow">Weekly summary</span>
          <strong>{Math.round(weekTotal)} / {weeklyBudget}</strong>
          <p>Calories consumed vs budget</p>
        </div>
        <CalendarDays size={24} />
      </section>

      <section className="surface chart-surface">
        <div className="section-heading">
          <h2>7-day calories</h2>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={seven}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="calories" fill={profile.color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="surface chart-surface">
        <div className="section-heading">
          <h2>30-day macros</h2>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={thirty}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" minTickGap={22} tickLine={false} />
            <YAxis hide />
            <Tooltip />
            <Line dataKey="protein" dot={false} stroke="#2f7d71" strokeWidth={2} />
            <Line dataKey="carbs" dot={false} stroke="#d56a4f" strokeWidth={2} />
            <Line dataKey="fat" dot={false} stroke="#6a7fdb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="surface">
        <div className="section-heading">
          <h2>Entries</h2>
        </div>
        <div className="log-list">
          {logs.map((log) => (
            <div className="log-row" key={log.id}>
              <div>
                <strong>{log.name}</strong>
                <span>{new Date(log.loggedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
              <b>{Math.round(log.nutrition.calories)} kcal</b>
              <button className="mini-icon" onClick={() => readd(log)} title="Re-add" type="button">
                <RotateCcw size={16} />
              </button>
              <button className="mini-icon danger-icon" onClick={() => void onDelete(log.id)} title="Delete" type="button">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

