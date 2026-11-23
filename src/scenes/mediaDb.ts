const DB_NAME = 'neondeck-media';
const STORE = 'wallpapers';
const DB_VERSION = 1;

export const MAX_CUSTOM_BYTES = 10 * 1024 * 1024;
export const CUSTOM_ACCEPT_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export interface CustomWallpaper {
  id: string;
  name: string;
  blob: Blob;
  createdAt: number;
}

function openMediaDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

function txDone<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

export async function listCustomWallpapers(): Promise<CustomWallpaper[]> {
  try {
    const db = await openMediaDb();
    if (!db) return [];
    const tx = db.transaction(STORE, 'readonly');
    const all = await txDone(tx.objectStore(STORE).getAll() as IDBRequest<CustomWallpaper[]>);
    db.close();
    return Array.isArray(all) ? all.sort((a, b) => b.createdAt - a.createdAt) : [];
  } catch {
    return [];
  }
}

export async function getCustomWallpaper(id: string): Promise<CustomWallpaper | null> {
  if (!id) return null;
  try {
    const db = await openMediaDb();
    if (!db) return null;
    const tx = db.transaction(STORE, 'readonly');
    const item = await txDone(tx.objectStore(STORE).get(id) as IDBRequest<CustomWallpaper | undefined>);
    db.close();
    return item ?? null;
  } catch {
    return null;
  }
}

export async function saveCustomWallpaper(file: File): Promise<CustomWallpaper> {
  if (file.size > MAX_CUSTOM_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }
  const db = await openMediaDb();
  if (!db) throw new Error('STORAGE_UNAVAILABLE');
  const item: CustomWallpaper = {
    id: `cw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: file.name.slice(0, 60) || 'Wallpaper',
    blob: file,
    createdAt: Date.now(),
  };
  const tx = db.transaction(STORE, 'readwrite');
  await txDone(tx.objectStore(STORE).put(item));
  db.close();
  return item;
}

export async function deleteCustomWallpaper(id: string): Promise<void> {
  if (!id) return;
  try {
    const db = await openMediaDb();
    if (!db) return;
    const tx = db.transaction(STORE, 'readwrite');
    await txDone(tx.objectStore(STORE).delete(id));
    db.close();
  } catch {
    // best-effort cleanup
  }
}
