import "expo-sqlite/localStorage/install";

/**
 * Storage wrapper using expo-sqlite localStorage polyfill.
 * Synchronous API, works in Expo Go — no native build required.
 */
export const storage = {
  getString: (key: string): string | undefined => {
    return localStorage.getItem(key) ?? undefined;
  },
  set: (key: string, value: string): void => {
    localStorage.setItem(key, value);
  },
  delete: (key: string): void => {
    localStorage.removeItem(key);
  },
};

/**
 * Supabase-compatible storage adapter.
 */
export const MMKVSupabaseAdapter = {
  getItem: (key: string): string | null => {
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },
};
