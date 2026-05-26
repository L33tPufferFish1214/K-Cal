import { useState } from 'react';
import { Bell, Save, ShieldCheck } from 'lucide-react';
import type { NutritionKey, UserProfile } from '../types';
import { macroMeta, nutritionKeys } from '../lib/nutrition';
import { requestNotificationPermission } from '../lib/reminders';

interface GoalsViewProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
}

export function GoalsView({ profile, onSaveProfile }: GoalsViewProps) {
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [saved, setSaved] = useState(false);

  function setTarget(key: NutritionKey, value: number) {
    setDraft((current) => ({
      ...current,
      dailyGoal: key === 'calories' ? value : current.dailyGoal,
      targets: {
        ...current.targets,
        [key]: value
      }
    }));
  }

  async function enableNotifications() {
    const next = await requestNotificationPermission();
    setPermission(next);
    setDraft((current) => ({ ...current, notificationsEnabled: next === 'granted' }));
  }

  async function save() {
    await onSaveProfile({
      ...draft,
      targets: {
        ...draft.targets,
        calories: draft.dailyGoal
      }
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="screen stack">
      <section className="surface stack">
        <div className="section-heading">
          <h2>Profile</h2>
          <ShieldCheck size={20} />
        </div>
        <div className="field-grid">
          <label className="field">
            <span>Name</span>
            <input onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} value={draft.name} />
          </label>
          <label className="field">
            <span>Daily calories</span>
            <input min={800} onChange={(event) => setTarget('calories', Number(event.target.value))} type="number" value={draft.dailyGoal} />
          </label>
          <label className="field">
            <span>Reminder</span>
            <input onChange={(event) => setDraft((current) => ({ ...current, reminderTime: event.target.value }))} type="time" value={draft.reminderTime} />
          </label>
          <label className="field">
            <span>Color</span>
            <input onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))} type="color" value={draft.color} />
          </label>
        </div>
      </section>

      <section className="surface stack">
        <div className="section-heading">
          <h2>Targets</h2>
        </div>
        <div className="macro-input-grid">
          {nutritionKeys.map((key) => (
            <label className="field compact-field" key={key}>
              <span>
                {macroMeta[key].label} <small>{macroMeta[key].unit}</small>
              </span>
              <input min={0} onChange={(event) => setTarget(key, Number(event.target.value))} step="0.1" type="number" value={draft.targets[key]} />
            </label>
          ))}
        </div>
      </section>

      <section className="surface stack">
        <div className="section-heading">
          <h2>Reminders</h2>
          <Bell size={20} />
        </div>
        <div className="toggle-row">
          <div>
            <strong>Browser alerts</strong>
            <span>{permission === 'unsupported' ? 'Unsupported' : permission}</span>
          </div>
          <button className="ghost-button" onClick={() => void enableNotifications()} type="button">
            <Bell size={18} />
            Enable
          </button>
        </div>
      </section>

      <button className="primary-button sticky-save" onClick={() => void save()} type="button">
        <Save size={18} />
        {saved ? 'Saved' : 'Save goals'}
      </button>
    </div>
  );
}

