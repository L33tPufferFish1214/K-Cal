import { AlertTriangle, CheckCircle2, Flame, TrendingUp } from 'lucide-react';
import type { FoodLog, UserProfile } from '../types';
import { buildAlerts, macroMeta, macroPercent, nutritionKeys, todayRange, totalForRange, weekRange } from '../lib/nutrition';

interface DashboardProps {
  profile: UserProfile;
  logs: FoodLog[];
}

export function Dashboard({ profile, logs }: DashboardProps) {
  const today = todayRange();
  const week = weekRange();
  const todayTotals = totalForRange(logs, today.start, today.end);
  const weekTotals = totalForRange(logs, week.start, week.end);
  const dailyPercent = macroPercent(todayTotals.calories, profile.dailyGoal);
  const weekBudget = profile.dailyGoal * 7;
  const weekPercent = macroPercent(weekTotals.calories, weekBudget);
  const alerts = buildAlerts(todayTotals, profile.targets);
  const recent = logs.slice(0, 4);
  const circle = 2 * Math.PI * 54;

  return (
    <div className="screen stack">
      <section className="dashboard-hero">
        <div className="progress-ring" style={{ color: profile.color }}>
          <svg viewBox="0 0 128 128" aria-label={`${dailyPercent}% of daily calories`}>
            <circle className="ring-bg" cx="64" cy="64" r="54" />
            <circle
              className="ring-fill"
              cx="64"
              cy="64"
              r="54"
              strokeDasharray={circle}
              strokeDashoffset={circle - circle * Math.min(dailyPercent, 100) / 100}
            />
          </svg>
          <div className="ring-label">
            <strong>{Math.round(todayTotals.calories)}</strong>
            <span>of {profile.dailyGoal}</span>
          </div>
        </div>

        <div className="hero-copy">
          <span className="eyebrow">Today</span>
          <h2>{dailyPercent}%</h2>
          <p>{Math.max(0, Math.round(profile.dailyGoal - todayTotals.calories))} kcal left</p>
        </div>
      </section>

      <section className="weekly-band">
        <div>
          <span className="eyebrow">Week</span>
          <strong>{Math.round(weekTotals.calories)} / {weekBudget}</strong>
          <p>Fixed daily goal: {profile.dailyGoal} kcal</p>
        </div>
        <div className="mini-meter" aria-label={`${weekPercent}% of weekly budget`}>
          <span style={{ width: `${Math.min(weekPercent, 100)}%`, background: profile.color }} />
        </div>
      </section>

      {alerts.length ? (
        <section className="alert-list">
          {alerts.map((alert) => (
            <div className={`alert ${alert.level}`} key={alert.key}>
              <AlertTriangle size={18} />
              <span>{alert.message}</span>
            </div>
          ))}
        </section>
      ) : (
        <section className="alert success">
          <CheckCircle2 size={18} />
          <span>Limits are in range</span>
        </section>
      )}

      <section className="macro-rail" aria-label="Macro progress">
        {nutritionKeys.map((key) => {
          const percent = macroPercent(todayTotals[key], profile.targets[key]);
          return (
            <article className="macro-card" key={key}>
              <div className="macro-card-head">
                <span>{macroMeta[key].label}</span>
                {key === 'calories' ? <Flame size={16} /> : <TrendingUp size={16} />}
              </div>
              <strong>
                {Math.round(todayTotals[key])}
                <small>{macroMeta[key].unit}</small>
              </strong>
              <div className="mini-meter">
                <span className={percent >= 100 && macroMeta[key].kind === 'limit' ? 'danger-fill' : ''} style={{ width: `${Math.min(percent, 100)}%` }} />
              </div>
              <p>{percent}% of {Math.round(profile.targets[key])}{macroMeta[key].unit}</p>
            </article>
          );
        })}
      </section>

      <section className="surface">
        <div className="section-heading">
          <h2>Recent meals</h2>
        </div>
        {recent.length ? (
          <div className="log-list">
            {recent.map((log) => (
              <div className="log-row" key={log.id}>
                <div>
                  <strong>{log.name}</strong>
                  <span>{new Date(log.loggedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
                <b>{Math.round(log.nutrition.calories)} kcal</b>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No meals logged today.</p>
        )}
      </section>
    </div>
  );
}

