import type { AppPreference, CachedFood, FoodDraft, FoodLog, UserProfile } from '../types';
import { createId } from './id';

const DB_NAME = 'kcal-family-tracker';
const DB_VERSION = 1;

type StoreName = 'profiles' | 'logs' | 'foodCache' | 'preferences';

const storeKeyPaths: Record<StoreName, string> = {
  profiles: 'id',
  logs: 'id',
  foodCache: 'id',
  preferences: 'key'
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      for (const [storeName, keyPath] of Object.entries(storeKeyPaths) as Array<[StoreName, string]>) {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath });
        }
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>
): Promise<T> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const result = await callback(store);
    return result instanceof IDBRequest ? requestToPromise(result) : result;
  } finally {
    database.close();
  }
}

async function getAll<T>(storeName: StoreName): Promise<T[]> {
  return withStore(storeName, 'readonly', (store) => store.getAll() as IDBRequest<T[]>);
}

async function put<T>(storeName: StoreName, value: T): Promise<void> {
  await withStore(storeName, 'readwrite', async (store) => {
    await requestToPromise(store.put(value));
  });
}

async function add<T>(storeName: StoreName, value: T): Promise<void> {
  await withStore(storeName, 'readwrite', async (store) => {
    await requestToPromise(store.add(value));
  });
}

async function remove(storeName: StoreName, key: string): Promise<void> {
  await withStore(storeName, 'readwrite', async (store) => {
    await requestToPromise(store.delete(key));
  });
}

export async function getProfiles(): Promise<UserProfile[]> {
  const profiles = await getAll<UserProfile>('profiles');
  return profiles.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await put('profiles', { ...profile, updatedAt: new Date().toISOString() });
}

export async function getLogsForUser(userId: string): Promise<FoodLog[]> {
  const logs = await getAll<FoodLog>('logs');
  return logs.filter((log) => log.userId === userId).sort((left, right) => right.loggedAt.localeCompare(left.loggedAt));
}

export async function addFoodLog(log: FoodLog): Promise<void> {
  await add('logs', log);
  await rememberFood(log);
}

export async function deleteFoodLog(id: string): Promise<void> {
  await remove('logs', id);
}

export async function getRecentFoods(userId: string, limit = 30): Promise<CachedFood[]> {
  const foods = await getAll<CachedFood>('foodCache');
  return foods
    .filter((food) => food.userId === userId)
    .sort((left, right) => right.lastUsedAt.localeCompare(left.lastUsedAt))
    .slice(0, limit);
}

export async function rememberFood(draft: FoodDraft & { userId: string; loggedAt?: string; createdAt?: string }): Promise<void> {
  const normalizedName = draft.name.trim().toLowerCase();
  const foods = await getAll<CachedFood>('foodCache');
  const existing = foods.find((food) => food.userId === draft.userId && food.normalizedName === normalizedName);
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

  await put('foodCache', cached);
}

export async function setPreference(key: string, value: string): Promise<void> {
  await put<AppPreference>('preferences', { key, value });
}

export async function getPreference(key: string): Promise<string | undefined> {
  const preferences = await getAll<AppPreference>('preferences');
  return preferences.find((preference) => preference.key === key)?.value;
}

