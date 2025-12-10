import { db } from './db';
import { Setting } from '../types';

export const settingsStore = {
  async get<T>(key: string): Promise<Setting<T> | undefined> {
    try {
      return await db.settings.get(key) as Setting<T> | undefined;
    } catch (error) {
      console.error(`Failed to get setting for key "${key}":`, error);
      return undefined;
    }
  },
  
  async getAll(): Promise<Setting[]> {
    try {
      return await db.settings.toArray();
    } catch (error) {
      console.error("Failed to get all settings:", error);
      return [];
    }
  },

  async save(setting: Setting): Promise<void> {
    try {
      await db.settings.put(setting);
    } catch (error) {
      console.error(`Failed to save setting for key "${setting.key}":`, error);
    }
  },

  async clearAll(): Promise<void> {
    try {
        await db.settings.clear();
    } catch (error) {
        console.error("Failed to clear settings:", error);
    }
  },
};
