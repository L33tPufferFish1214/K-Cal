import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, LogOut, Moon, ScanLine, Settings, Sun, Utensils } from 'lucide-react';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { GoalsView } from './components/GoalsView';
import { LogView } from './components/LogView';
import { addFoodLog, deleteFoodLog, getLogsForUser, getProfiles, getRecentFoods, saveProfile } from './lib/db';
import { createPinHash, verifyPin } from './lib/crypto';
import { createId } from './lib/id';
import { buildAlerts, nutritionWithOil, todayRange, totalForRange } from './lib/nutrition';
import { shouldFireDailyReminder, showBrowserNotification } from './lib/reminders';
import type { CachedFood, FoodDraft, FoodLog, Nutrition, OilSelection, ThemeMode, UserProfile } from './types';

type View = 'dashboard' | 'log' | 'scan' | 'history' | 'goals';

const HistoryView = lazy(() => import('./components/HistoryView').then((module) => ({ default: module.HistoryView })));
const ScanView = lazy(() => import('./components/ScanView').then((module) => ({ default: module.ScanView })));

const navItems: Array<{ id: View; label: string; icon: typeof BarChart3 }> = [
  { id: 'dashboard', label: 'Today', icon: BarChart3 },
  { id: 'log', label: 'Log', icon: Utensils },
  { id: 'scan', label: 'Scan', icon: ScanLine },
  { id: 'history', label: 'History', icon: BarChart3 },
  { id: 'goals', label: 'Goals', icon: Settings }
];

function themeFromStorage(): ThemeMode {
  return (localStorage.getItem('kcal-theme') as ThemeMode | null) ?? 'light';
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(themeFromStorage);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [recentFoods, setRecentFoods] = useState<CachedFood[]>([]);
  const [toast, setToast] = useState('');

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [profiles, activeProfileId]
  );

  const refreshProfiles = useCallback(async () => {
    setProfiles(await getProfiles());
  }, []);

  const refreshUserData = useCallback(async (userId: string) => {
    const [nextLogs, nextFoods] = await Promise.all([getLogsForUser(userId), getRecentFoods(userId)]);
    setLogs(nextLogs);
    setRecentFoods(nextFoods);
  }, []);

  useEffect(() => {
    void refreshProfiles();
  }, [refreshProfiles]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('kcal-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (activeProfile) {
      void refreshUserData(activeProfile.id);
    } else {
      setLogs([]);
      setRecentFoods([]);
    }
  }, [activeProfile, refreshUserData]);

  useEffect(() => {
    if (!activeProfile) {
      return;
    }

    const interval = window.setInterval(() => {
      if (shouldFireDailyReminder(activeProfile)) {
        setToast('Reminder: log meals for today.');
        showBrowserNotification('Kcal reminder', 'Log meals for today.');
      }
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [activeProfile]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleCreateProfile(input: {
    name: string;
    pin: string;
    color: string;
    dailyGoal: number;
    targets: Nutrition;
    reminderTime: string;
  }) {
    const now = new Date().toISOString();
    const { pinHash, pinSalt } = await createPinHash(input.pin);
    const profile: UserProfile = {
      id: createId('user'),
      name: input.name,
      color: input.color,
      pinHash,
      pinSalt,
      dailyGoal: input.dailyGoal,
      targets: input.targets,
      reminderTime: input.reminderTime,
      notificationsEnabled: false,
      createdAt: now,
      updatedAt: now
    };

    await saveProfile(profile);
    await refreshProfiles();
    setActiveProfileId(profile.id);
  }

  async function handleUnlock(profile: UserProfile, pin: string): Promise<boolean> {
    const ok = await verifyPin(pin, profile.pinHash, profile.pinSalt);
    if (ok) {
      setActiveProfileId(profile.id);
      setView('dashboard');
    }
    return ok;
  }

  async function handleSaveLog(draft: FoodDraft, oil: OilSelection) {
    if (!activeProfile) {
      return;
    }

    const now = new Date().toISOString();
    const finalNutrition = nutritionWithOil(draft.nutrition, oil);
    const log: FoodLog = {
      ...draft,
      id: createId('log'),
      userId: activeProfile.id,
      loggedAt: now,
      createdAt: now,
      nutrition: finalNutrition,
      baseNutrition: draft.nutrition,
      oil
    };

    await addFoodLog(log);
    await refreshUserData(activeProfile.id);
    setView('dashboard');

    const totals = totalForRange([...logs, log], todayRange().start, todayRange().end);
    const alerts = buildAlerts(totals, activeProfile.targets);
    const danger = alerts.find((alert) => alert.level === 'danger');
    const warning = alerts.find((alert) => alert.level === 'warning');
    if (danger || warning) {
      const message = (danger ?? warning)!.message;
      setToast(message);
      showBrowserNotification('Kcal alert', message);
    } else {
      setToast(`${draft.name} logged.`);
    }
  }

  async function handleDeleteLog(id: string) {
    if (!activeProfile) {
      return;
    }
    await deleteFoodLog(id);
    await refreshUserData(activeProfile.id);
  }

  async function handleSaveProfile(next: UserProfile) {
    await saveProfile(next);
    await refreshProfiles();
    setToast('Goals saved.');
  }

  if (!activeProfile) {
    return <AuthScreen onCreateProfile={handleCreateProfile} onUnlock={handleUnlock} profiles={profiles} />;
  }

  const title = navItems.find((item) => item.id === view)?.label ?? 'Today';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="profile-chip">
          <span className="profile-dot small" style={{ background: activeProfile.color }} />
          <div>
            <strong>{activeProfile.name}</strong>
            <span>{title}</span>
          </div>
        </div>
        <div className="top-actions">
          <button className="icon-button" onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))} title="Toggle theme" type="button">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="icon-button" onClick={() => setActiveProfileId(null)} title="Lock profile" type="button">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="main-content">
        {view === 'dashboard' ? <Dashboard logs={logs} profile={activeProfile} /> : null}
        {view === 'log' ? <LogView logs={logs} onSave={handleSaveLog} recentFoods={recentFoods} /> : null}
        <Suspense fallback={<div className="surface loading-surface">Loading...</div>}>
          {view === 'scan' ? <ScanView onSave={handleSaveLog} /> : null}
          {view === 'history' ? <HistoryView logs={logs} onDelete={handleDeleteLog} onSave={handleSaveLog} profile={activeProfile} /> : null}
        </Suspense>
        {view === 'goals' ? <GoalsView onSaveProfile={handleSaveProfile} profile={activeProfile} /> : null}
      </main>

      <nav className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button className={view === item.id ? 'is-active' : ''} key={item.id} onClick={() => setView(item.id)} type="button">
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
