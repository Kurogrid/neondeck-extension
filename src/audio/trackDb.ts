const DB_NAME = 'neondeck-audio';
const STORE = 'tracks';
const RADIO_SLOT_STORE = 'radioSlots';
const DB_VERSION = 2;

export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
export const AUDIO_ACCEPT_MIME = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/flac',
  'audio/webm',
]);

export interface LocalTrack {
  id: string;
  title: string;
  blob: Blob;
  createdAt: number;
}

export interface RadioSlotAudio {
  trackId: string;
  title: string;
  blob: Blob;
  updatedAt: number;
}

function openAudioDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(RADIO_SLOT_STORE)) {
        db.createObjectStore(RADIO_SLOT_STORE, { keyPath: 'trackId' });
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

const cleanTitle = (name: string) =>
  name.replace(/\.(mp3|ogg|wav|m4a|aac|flac|webm)$/i, '').trim().slice(0, 64) || 'Track';

export async function listLocalTracks(): Promise<LocalTrack[]> {
  try {
    const db = await openAudioDb();
    if (!db) return [];
    const tx = db.transaction(STORE, 'readonly');
    const all = await txDone(tx.objectStore(STORE).getAll() as IDBRequest<LocalTrack[]>);
    db.close();
    return Array.isArray(all) ? all.sort((a, b) => b.createdAt - a.createdAt) : [];
  } catch {
    return [];
  }
}

export async function saveLocalTrack(file: File): Promise<LocalTrack> {
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }
  const db = await openAudioDb();
  if (!db) throw new Error('STORAGE_UNAVAILABLE');
  const item: LocalTrack = {
    id: `lt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: cleanTitle(file.name),
    blob: file,
    createdAt: Date.now(),
  };
  const tx = db.transaction(STORE, 'readwrite');
  await txDone(tx.objectStore(STORE).put(item));
  db.close();
  return item;
}

export async function deleteLocalTrack(id: string): Promise<void> {
  if (!id) return;
  try {
    const db = await openAudioDb();
    if (!db) return;
    const tx = db.transaction(STORE, 'readwrite');
    await txDone(tx.objectStore(STORE).delete(id));
    db.close();
  } catch {
    // best-effort cleanup
  }
}

export async function listRadioSlotIds(): Promise<string[]> {
  try {
    const db = await openAudioDb();
    if (!db) return [];
    const tx = db.transaction(RADIO_SLOT_STORE, 'readonly');
    const keys = await txDone(tx.objectStore(RADIO_SLOT_STORE).getAllKeys() as IDBRequest<IDBValidKey[]>);
    db.close();
    return Array.isArray(keys) ? keys.map((k) => String(k)) : [];
  } catch {
    return [];
  }
}

export async function getRadioSlot(trackId: string): Promise<RadioSlotAudio | null> {
  if (!trackId) return null;
  try {
    const db = await openAudioDb();
    if (!db) return null;
    const tx = db.transaction(RADIO_SLOT_STORE, 'readonly');
    const item = await txDone(tx.objectStore(RADIO_SLOT_STORE).get(trackId) as IDBRequest<RadioSlotAudio | undefined>);
    db.close();
    return item ?? null;
  } catch {
    return null;
  }
}

export async function saveRadioSlot(trackId: string, file: File): Promise<RadioSlotAudio> {
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }
  const db = await openAudioDb();
  if (!db) throw new Error('STORAGE_UNAVAILABLE');
  const item: RadioSlotAudio = {
    trackId,
    title: cleanTitle(file.name),
    blob: file,
    updatedAt: Date.now(),
  };
  const tx = db.transaction(RADIO_SLOT_STORE, 'readwrite');
  await txDone(tx.objectStore(RADIO_SLOT_STORE).put(item));
  db.close();
  return item;
}

export async function deleteRadioSlot(trackId: string): Promise<void> {
  if (!trackId) return;
  try {
    const db = await openAudioDb();
    if (!db) return;
    const tx = db.transaction(RADIO_SLOT_STORE, 'readwrite');
    await txDone(tx.objectStore(RADIO_SLOT_STORE).delete(trackId));
    db.close();
  } catch {
    // best-effort cleanup
  }
}
