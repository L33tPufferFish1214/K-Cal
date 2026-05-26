import Dexie, { type Table } from 'dexie';
import type { AppPreference, CachedFood, FoodDraft, FoodLog, UserProfile } from '../types';
import { createId } from './id';

class KcalDatabase extends Dexie {
  profiles!: Table<UserProfile, string>;
  logs!: Table<FoodLog, string>;
  foodCache!: Table<CachedFood, string>;
  preferences!: Table<AppPreference, string>;

  constructor() {
    super('kcal-family-tracker');
    this.version(1).stores({
      profiles: 'id, name, createdAt, updatedAt',
      logs: 'id, userId, loggedAt, createdAt, [userId+loggedAt], name',
      foodCache: 'id, userId, normalizedName, barcode, lastUsedAt, [userId+lastUsedAt]',
      preferences: 'key'
    });
  }
}

export const db = new KcalDatabase();

export async function getProfiles(): Promise<UserProfile[]> {
  return db.profiles.orderBy('createdAt').toArray();
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await db.profiles.put({ ...profile, updatedAt: new Date().toISOString() });
}

export async function getLogsForUser(userId: string): Promise<FoodLog[]> {
  const logs = await db.logs.where('userId').equals(userId).toArray();
  return logs.sort((left, right) => right.loggedAt.localeCompare(left.loggedAt));
}

export async function addFoodLog(log: FoodLog): Promise<void> {
  await db.transaction('rw', db.logs, db.foodCache, async () => {
    await db.logs.add(log);
    await rememberFood(log);
  });
}

export async function deleteFoodLog(id: string): Promise<void> {
  await db.logs.delete(id);
}

export async function getRecentFoods(userId: string, limit = 30): Promise<CachedFood[]> {
  const foods = await db.foodCache.where('userId').equals(userId).toArray();
  return foods.sort((left, right) => right.lastUsedAt.localeCompare(left.lastUsedAt)).slice(0, limit);
}

export async function rememberFood(draft: FoodDraft & { userId: string; loggedAt?: string; createdAt?: string }): Promise<void> {
  const normalizedName = draft.name.trim().toLowerCase();
  const existing = await db.foodCache.where({ userId: draft.userId, normalizedName }).first();
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

  await db.foodCache.put(cached);
}

export async function setPreference(key: string, value: string): Promise<void> {
  await db.preferences.put({ key, value });
}

export async function getPreference(key: string): Promise<string | undefined> {
  return (await db.preferences.get(key))?.value;
}
