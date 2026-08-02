/**
 * Local persistence for the scan history, on top of IndexedDB.
 *
 * Photos are kept as the data URL strings the capture pipeline already produces (480x480
 * JPEG, roughly 35-65 KB each once base64-encoded). At MAX_HISTORY_ITEMS that is about
 * 1 MB, which IndexedDB holds comfortably and which rules out localStorage: its ~5 MB
 * budget is too close, and its synchronous API would block the main thread on every save.
 *
 * Migration note: if the cap ever grows past ~100 items the base64 overhead stops being
 * acceptable. Switch to storing Blobs and bump DB_VERSION with a migration; that also
 * changes the `photoUrl` contract consumed by `next/image`, so it is not a free change.
 *
 * This module owns storage and nothing else. It deliberately knows nothing about model
 * classes or the file dictionary: validation here is structural, never semantic, so a
 * record pointing at a class the model no longer predicts is still returned intact.
 */

export interface RecentScanItem {
  id: string;
  classId: string;
  photoUrl?: string | null;
  timestamp: number;
}

export const MAX_HISTORY_ITEMS = 20;

const DB_NAME = 'endofile-ai';
const DB_VERSION = 1;
const STORE_NAME = 'scan-history';
const TIMESTAMP_INDEX = 'by-timestamp';

/** Flips once an open attempt fails, so private mode is reported honestly. */
let storageFailed = false;

/** `false` when IndexedDB cannot be used: SSR, private mode, blocked storage. */
export function isHistoryStorageAvailable(): boolean {
  if (storageFailed) return false;
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

/** Unique id for a scan. `Date.now()` alone collides on rapid consecutive captures. */
export function createScanId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `scan-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (!isHistoryStorageAvailable()) {
    return Promise.reject(new Error('IndexedDB no está disponible en este contexto'));
  }

  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex(TIMESTAMP_INDEX, 'timestamp');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('No se pudo abrir la base de datos'));
      request.onblocked = () => reject(new Error('La base de datos está bloqueada por otra pestaña'));
    }).catch((err: unknown) => {
      // Let a later call retry, but remember that storage is not working
      dbPromise = null;
      storageFailed = true;
      throw err;
    });
  }

  return dbPromise;
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Petición de IndexedDB fallida'));
  });
}

function promisifyTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Transacción de IndexedDB fallida'));
    tx.onabort = () => reject(tx.error ?? new Error('Transacción de IndexedDB abortada'));
  });
}

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

/** Structural check only: shape and types, never whether `classId` is still a known class. */
function isValidScanItem(value: unknown): value is RecentScanItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Partial<RecentScanItem>;

  return (
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.classId === 'string' && item.classId.length > 0 &&
    typeof item.timestamp === 'number' && Number.isFinite(item.timestamp) &&
    (item.photoUrl === undefined || item.photoUrl === null || typeof item.photoUrl === 'string')
  );
}

/** Primary keys ordered oldest first, via the timestamp index. */
async function keysOldestFirst(db: IDBDatabase): Promise<IDBValidKey[]> {
  const tx = db.transaction(STORE_NAME, 'readonly');
  const request = tx.objectStore(STORE_NAME).index(TIMESTAMP_INDEX).getAllKeys() as IDBRequest<IDBValidKey[]>;
  return promisifyRequest(request);
}

async function deleteKeys(db: IDBDatabase, keys: IDBValidKey[]): Promise<void> {
  if (keys.length === 0) return;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  for (const key of keys) {
    store.delete(key);
  }
  await promisifyTransaction(tx);
}

/** Drops the oldest records above the cap. */
async function pruneToCap(db: IDBDatabase): Promise<void> {
  const keys = await keysOldestFirst(db);
  const excess = keys.length - MAX_HISTORY_ITEMS;
  if (excess > 0) {
    await deleteKeys(db, keys.slice(0, excess));
  }
}

async function putItem(db: IDBDatabase, item: RecentScanItem): Promise<void> {
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(item);
  await promisifyTransaction(tx);
}

/** Reads the history, newest first and trimmed to the cap. Returns `[]` on any failure. */
export async function loadScanHistory(): Promise<RecentScanItem[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll() as IDBRequest<unknown[]>;
    const records = await promisifyRequest(request);

    const valid = records.filter(isValidScanItem);
    const discarded = records.length - valid.length;
    if (discarded > 0) {
      console.warn(`[Historial] ${discarded} registro(s) con formato no válido descartados al leer.`);
    }

    return valid.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_HISTORY_ITEMS);
  } catch (err) {
    console.warn('[Historial] No se pudo leer el historial persistido:', err);
    return [];
  }
}

/**
 * Stores one scan and prunes the overflow. Never rejects: a failed write must not
 * interrupt the capture flow, the item stays in memory for the session either way.
 */
export async function saveScanItem(item: RecentScanItem): Promise<void> {
  try {
    const db = await openDatabase();
    await putItem(db, item);
    await pruneToCap(db);
  } catch (err) {
    if (!isQuotaError(err)) {
      console.warn('[Historial] No se pudo guardar la detección:', err);
      return;
    }

    console.warn('[Historial] Cuota agotada; purgando los registros más antiguos y reintentando…');
    try {
      const db = await openDatabase();
      const keys = await keysOldestFirst(db);
      await deleteKeys(db, keys.slice(0, Math.max(1, Math.ceil(keys.length / 2))));
      await putItem(db, item);
    } catch (retryErr) {
      console.warn('[Historial] La escritura falló tras purgar; el historial seguirá solo en memoria:', retryErr);
    }
  }
}

/** Removes a single scan by id. Never rejects. */
export async function deleteScanItem(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    await deleteKeys(db, [id]);
  } catch (err) {
    console.warn('[Historial] No se pudo eliminar la detección:', err);
  }
}

/** Empties the store. Never rejects. */
export async function clearScanHistory(): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    await promisifyTransaction(tx);
  } catch (err) {
    console.warn('[Historial] No se pudo vaciar el historial:', err);
  }
}
