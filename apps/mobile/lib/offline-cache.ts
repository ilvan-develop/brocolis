import * as SecureStore from "expo-secure-store";

type CacheOptions = {
  key: string;
  maxAge: number;
};

export class ExpoSecureStoreAdapter {
  private key: string;
  private maxAge: number;

  constructor(options: CacheOptions) {
    this.key = options.key;
    this.maxAge = options.maxAge;
  }

  async getItem(key: string): Promise<string | null> {
    const fullKey = `${this.key}:${key}`;
    const raw = await SecureStore.getItemAsync(fullKey);
    if (!raw) return null;

    try {
      const entry = JSON.parse(raw) as { timestamp: number; data: string };
      if (Date.now() - entry.timestamp > this.maxAge) {
        await SecureStore.deleteItemAsync(fullKey);
        return null;
      }
      return entry.data;
    } catch {
      await SecureStore.deleteItemAsync(fullKey);
      return null;
    }
  }

  async setItem(key: string, data: string): Promise<void> {
    const fullKey = `${this.key}:${key}`;
    const entry = JSON.stringify({ timestamp: Date.now(), data });
    await SecureStore.setItemAsync(fullKey, entry);
  }

  async removeItem(key: string): Promise<void> {
    const fullKey = `${this.key}:${key}`;
    await SecureStore.deleteItemAsync(fullKey);
  }
}

export const offlineCache = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await SecureStore.getItemAsync(`offline:${key}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set<T>(
    key: string,
    value: T,
    maxAgeMs = 24 * 60 * 60 * 1000,
  ): Promise<void> {
    const entry = JSON.stringify({
      timestamp: Date.now(),
      data: value,
      maxAge: maxAgeMs,
    });
    await SecureStore.setItemAsync(`offline:${key}`, entry);
  },

  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(`offline:${key}`);
  },

  async clear(): Promise<void> {
    const keys = ["offline:catalog", "offline:cart", "offline:orders"];
    for (const key of keys) {
      await SecureStore.deleteItemAsync(key);
    }
  },
};
