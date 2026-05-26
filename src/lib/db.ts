import type { AppPreference, CachedFood, FoodDraft, FoodLog, UserProfile } from '../types';
import { createId } from './id';

const STORAGE_KEY = 'kcal-family-tracker-v1';

interface StoredState {
  profiles: UserProfile[];
  logs: FoodLog[];
  foodCache: CachedFood[];
  preferences: AppPreference[];
}

function emptyState(): StoredState {
  return {
    profiles: [],
    logs: [],
    foodCache: [],
    preferences: []
  };
}

function readState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyState();
    }

    return {
      ...emptyState(),
      ...JSON.parse(raw)
    };
  } catch {
    return emptyState();
  }
}

function writeState(state: StoredState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function getProfiles(): Promise<UserProfile[]> {
  return readState().profiles.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const state = readState();
  const updated = { ...profile, updatedAt: new Date().toISOString() };
  const index = state.profiles.findIndex((item) => item.id === profile.id);

  if (index >= 0) {
    state.profiles[index] = updated;
  } else {
    state.profiles.push(updated);
  }

  writeState(state);
}

export async function getLogsForUser(userId: string): Promise<FoodLog[]> {
  return readState()
    .logs.filter((log) => log.userId === userId)
    .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt));
}

export async function addFoodLog(log: FoodLog): Promise<void> {
  const state = readState();
  state.logs.push(log);
  writeState(state);
  await rememberFood(log);
}

export async function deleteFoodLog(id: string): Promise<void> {
  const state = readState();
  state.logs = state.logs.filter((log) => log.id !== id);
  writeState(state);
}

export async function getRecentFoods(userId: string, limit = 30): Promise<CachedFood[]> {
  return readState()
    .foodCache.filter((food) => food.userId === userId)
    .sort((left, right) => right.lastUsedAt.localeCompare(left.lastUsedAt))
    .slice(0, limit);
}

export async function rememberFood(draft: FoodDraft & { userId: string; loggedAt?: string; createdAt?: string }): Promise<void> {
  const state = readState();
  const normalizedName = draft.name.trim().toLowerCase();
  const existing = state.foodCache.find((food) => food.userId === draft.userId && food.normalizedName === normalizedName);
  const now = new Date().toISOString();

  const cached: CachedFood = {
    id: existing?.id ?? createId('food'),
    userId: draft.userId,
    normalizedName,
    name: draft.name,
    servingQuantity: draft.servingQuantity,
    servingUnit: draft.servingUnit,
    nutrition: draft.nutrition,
    source: draft.source,
    confidence: draft.confidence,
    barcode: draft.barcode,
    notes: draft.notes,
    lastUsedAt: now,
    createdAt: existing?.createdAt ?? now,
    timesLogged: (existing?.timesLogged ?? 0) + 1
  };

  if (existing) {
    state.foodCache = state.foodCache.map((food) => (food.id === existing.id ? cached : food));
  } else {
    state.foodCache.push(cached);
  }

  writeState(state);
}

export async function setPreference(key: string, value: string): Promise<void> {
  const state = readState();
  const preference = { key, value };
  const index = state.preferences.findIndex((item) => item.key === key);

  if (index >= 0) {
    state.preferences[index] = preference;
  } else {
    state.preferences.push(preference);
  }

  writeState(state);
}

export async function getPreference(key: string): Promise<string | undefined> {
  return readState().preferences.find((preference) => preference.key === key)?.value;
}

