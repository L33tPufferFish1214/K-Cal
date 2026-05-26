import { useMemo, useState } from 'react';
import { LockKeyhole, Plus, UserRound } from 'lucide-react';
import { defaultTargets } from '../data/oils';
import type { Nutrition, UserProfile } from '../types';

interface AuthScreenProps {
  profiles: UserProfile[];
  onCreateProfile: (input: {
    name: string;
    pin: string;
    color: string;
    dailyGoal: number;
    targets: Nutrition;
    reminderTime: string;
  }) => Promise<void>;
  onUnlock: (profile: UserProfile, pin: string) => Promise<boolean>;
}

const colorChoices = ['#2f7d71', '#d56a4f', '#6a7fdb', '#c08b34', '#7f5a83'];

export function AuthScreen({ profiles, onCreateProfile, onUnlock }: AuthScreenProps) {
  const [mode, setMode] = useState<'unlock' | 'create'>(profiles.length ? 'unlock' : 'create');
  const [selectedId, setSelectedId] = useState(profiles[0]?.id ?? '');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [color, setColor] = useState(colorChoices[0]);
  const [reminderTime, setReminderTime] = useState('19:00');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedProfile = useMemo(() => profiles.find((profile) => profile.id === selectedId) ?? profiles[0], [profiles, selectedId]);

  async function handleUnlock() {
    if (!selectedProfile) {
      return;
    }

    setBusy(true);
    setError('');
    const ok = await onUnlock(selectedProfile, pin);
    setBusy(false);
    if (!ok) {
      setError('PIN did not match.');
    }
  }

  async function handleCreate() {
    if (!name.trim() || newPin.length < 4) {
      setError('Use a name and a PIN with at least 4 digits.');
      return;
    }

    setBusy(true);
    setError('');
    await onCreateProfile({
      name: name.trim(),
      pin: newPin,
      color,
      dailyGoal,
      targets: { ...defaultTargets, calories: dailyGoal },
      reminderTime
    });
    setName('');
    setNewPin('');
    setMode('unlock');
    setBusy(false);
  }

  return (
    <main className="auth-layout">
      <section className="auth-panel">
        <div className="brand-row">
          <div className="brand-mark">K</div>
          <div>
            <h1>Kcal</h1>
            <p>Family nutrition tracker</p>
          </div>
        </div>

        {mode === 'unlock' && profiles.length > 0 ? (
          <div className="stack">
            <div className="profile-grid">
              {profiles.map((profile) => (
                <button
                  className={`profile-pick ${selectedProfile?.id === profile.id ? 'is-active' : ''}`}
                  key={profile.id}
                  onClick={() => setSelectedId(profile.id)}
                  type="button"
                >
                  <span className="profile-dot" style={{ background: profile.color }}>
                    <UserRound size={18} />
                  </span>
                  <span>{profile.name}</span>
                </button>
              ))}
            </div>

            <label className="field">
              <span>PIN</span>
              <input
                autoComplete="current-password"
                inputMode="numeric"
                maxLength={8}
                onChange={(event) => setPin(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleUnlock();
                  }
                }}
                type="password"
                value={pin}
              />
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="action-row">
              <button className="primary-button" disabled={busy} onClick={handleUnlock} type="button">
                <LockKeyhole size={18} />
                Unlock
              </button>
              <button className="ghost-button" onClick={() => setMode('create')} type="button">
                <Plus size={18} />
                Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="stack">
            <label className="field">
              <span>Name</span>
              <input autoComplete="name" onChange={(event) => setName(event.target.value)} value={name} />
            </label>
            <label className="field">
              <span>PIN</span>
              <input
                autoComplete="new-password"
                inputMode="numeric"
                maxLength={8}
                onChange={(event) => setNewPin(event.target.value)}
                type="password"
                value={newPin}
              />
            </label>
            <label className="field">
              <span>Daily calories</span>
              <input min={800} onChange={(event) => setDailyGoal(Number(event.target.value))} type="number" value={dailyGoal} />
            </label>
            <label className="field">
              <span>Reminder</span>
              <input onChange={(event) => setReminderTime(event.target.value)} type="time" value={reminderTime} />
            </label>
            <div className="swatch-row" aria-label="Profile color">
              {colorChoices.map((choice) => (
                <button
                  aria-label={`Use profile color ${choice}`}
                  className={`swatch ${choice === color ? 'is-active' : ''}`}
                  key={choice}
                  onClick={() => setColor(choice)}
                  style={{ background: choice }}
                  type="button"
                />
              ))}
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="action-row">
              <button className="primary-button" disabled={busy} onClick={handleCreate} type="button">
                <Plus size={18} />
                Create
              </button>
              {profiles.length ? (
                <button className="ghost-button" onClick={() => setMode('unlock')} type="button">
                  Back
                </button>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

