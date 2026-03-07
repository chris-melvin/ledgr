import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({
  id: "ledgr-storage",
});

/**
 * Supabase-compatible storage adapter using MMKV.
 * MMKV is synchronous and ~30x faster than AsyncStorage.
 */
export const MMKVSupabaseAdapter = {
  getItem: (key: string): string | null => {
    return storage.getString(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    storage.set(key, value);
  },
  removeItem: (key: string): void => {
    storage.delete(key);
  },
};
