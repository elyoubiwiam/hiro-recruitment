// Original CV files are kept in the browser's IndexedDB (too large for localStorage).
const DB = "talentdesk-files";
const STORE = "cvs";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

export const saveCvFile = (candidateId: string, file: File) => run<void>("readwrite", (s) => s.put(file, candidateId));
export const getCvFile = (candidateId: string) => run<File | undefined>("readonly", (s) => s.get(candidateId));
export const deleteCvFile = (candidateId: string) => run<void>("readwrite", (s) => s.delete(candidateId)).catch(() => {});
export const clearCvFiles = () => run<void>("readwrite", (s) => s.clear()).catch(() => {});

export function cvMeta(file: File) {
  return { name: file.name, type: file.type || "application/octet-stream", size: file.size, uploadedAt: new Date().toISOString() };
}
