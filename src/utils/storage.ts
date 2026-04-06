const STORAGE_PREFIX = 'abyssxenos_';

export function saveData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch {
    // storage full or unavailable
  }
}

export function loadData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export function clearData(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key);
}
