type Guard<T> = (value: unknown) => value is T;

const storageKey = (key: string) => `cpp-masterclass:v1:${key}`;

export function readStoredValue<T>(
  key: string,
  fallback: T,
  isValid: Guard<T>,
  legacyKey?: string
): T {
  try {
    const storage = window.localStorage;
    const currentKey = storageKey(key);
    const currentValue = storage.getItem(currentKey);
    const isLegacy = currentValue === null && legacyKey !== undefined;
    const serialized = currentValue ?? (legacyKey ? storage.getItem(legacyKey) : null);
    if (serialized === null) return fallback;

    const parsed: unknown = JSON.parse(serialized);
    if (!isValid(parsed)) {
      console.error(`Stored value "${key}" is invalid; using its default.`);
      return fallback;
    }

    if (isLegacy && legacyKey) {
      storage.setItem(currentKey, JSON.stringify(parsed));
      storage.removeItem(legacyKey);
    }
    return parsed;
  } catch (error) {
    console.error(`Could not read stored value "${key}":`, error);
    return fallback;
  }
}

export function writeStoredValue<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch (error) {
    console.error(`Could not save stored value "${key}":`, error);
  }
}
