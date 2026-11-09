/**
 * IndexedDB persistence. One database, one key-value store:
 *   "investigation" → SaveData   (the current case)
 *   "settings"      → Settings   (survives "New investigation")
 */
import type { SaveData, Settings } from './store';

const DB_NAME = 'thrombey-investigation';
const STORE = 'kv';
const SAVE_KEY = 'investigation';
const SETTINGS_KEY = 'settings';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function isValidSave(d: unknown): d is SaveData {
  if (!d || typeof d !== 'object') return false;
  const s = d as SaveData;
  return (s.version === 1 || s.version === 2 || s.version === 3) && !!s.player && Array.isArray(s.visited) && Array.isArray(s.notes) && typeof s.evidence === 'object';
}

export async function loadSave(): Promise<SaveData | null> {
  try {
    const d = await tx('readonly', (s) => s.get(SAVE_KEY));
    return isValidSave(d) ? d : null;
  } catch {
    return null;
  }
}

export async function writeSave(d: SaveData): Promise<boolean> {
  try {
    await tx('readwrite', (s) => s.put(d, SAVE_KEY));
    return true;
  } catch {
    return false;
  }
}

export async function clearSave(): Promise<void> {
  try {
    await tx('readwrite', (s) => s.delete(SAVE_KEY));
  } catch {
    /* ignore */
  }
}

export async function loadSettings(): Promise<Partial<Settings> | null> {
  try {
    return ((await tx('readonly', (s) => s.get(SETTINGS_KEY))) as Partial<Settings>) ?? null;
  } catch {
    return null;
  }
}

export async function writeSettings(st: Settings): Promise<void> {
  try {
    await tx('readwrite', (s) => s.put(st, SETTINGS_KEY));
  } catch {
    /* ignore */
  }
}

// ───────── Case reports & replay safety ─────────

const REPORTS_KEY = 'reports';
const BACKUP_KEY = 'investigation-backup';

export async function loadReports<T>(): Promise<T[]> {
  try {
    return ((await tx('readonly', (s) => s.get(REPORTS_KEY))) as T[]) ?? [];
  } catch {
    return [];
  }
}

export async function addReport<T>(r: T): Promise<void> {
  try {
    const list = await loadReports<T>();
    await tx('readwrite', (s) => s.put([...list, r].slice(-20), REPORTS_KEY));
  } catch {
    /* ignore */
  }
}

/** Keep the previous case file when a new investigation begins. */
export async function backupSave(): Promise<boolean> {
  const cur = await loadSave();
  if (!cur) return false;
  try {
    await tx('readwrite', (s) => s.put(cur, BACKUP_KEY));
    return true;
  } catch {
    return false;
  }
}

export async function loadBackup(): Promise<SaveData | null> {
  try {
    const d = await tx('readonly', (s) => s.get(BACKUP_KEY));
    return isValidSave(d) ? d : null;
  } catch {
    return null;
  }
}
