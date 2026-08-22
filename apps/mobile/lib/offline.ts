import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import * as SecureStore from "expo-secure-store";

type CacheOptions = {
  key: string;
  maxAge: number;
};

const _STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 24 * 60 * 60 * 1000;

export class ExpoSecureStoreAdapter implements Persister {
  private prefix: string;
  private maxAge: number;

  constructor(options: CacheOptions) {
    this.prefix = options.key;
    this.maxAge = options.maxAge;
  }

  async persistClient(client: PersistedClient): Promise<void> {
    const entry = JSON.stringify({
      timestamp: Date.now(),
      data: JSON.stringify(client),
    });
    await SecureStore.setItemAsync(this.prefix, entry);
  }

  async restoreClient(): Promise<PersistedClient | undefined> {
    const raw = await SecureStore.getItemAsync(this.prefix);
    if (!raw) return undefined;

    try {
      const entry = JSON.parse(raw) as { timestamp: number; data: string };
      if (Date.now() - entry.timestamp > this.maxAge) {
        await SecureStore.deleteItemAsync(this.prefix);
        return undefined;
      }
      return JSON.parse(entry.data) as PersistedClient;
    } catch {
      await SecureStore.deleteItemAsync(this.prefix);
      return undefined;
    }
  }

  async removeClient(): Promise<void> {
    await SecureStore.deleteItemAsync(this.prefix);
  }

  async getItem(key: string): Promise<string | null> {
    const fullKey = `${this.prefix}:${key}`;
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
    const fullKey = `${this.prefix}:${key}`;
    const entry = JSON.stringify({ timestamp: Date.now(), data });
    await SecureStore.setItemAsync(fullKey, entry);
  }

  async removeItem(key: string): Promise<void> {
    const fullKey = `${this.prefix}:${key}`;
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

  async set<T>(key: string, value: T, maxAgeMs = GC_TIME): Promise<void> {
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
