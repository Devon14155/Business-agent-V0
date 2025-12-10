import { db } from './db';
import { Memory } from '../types';

export const memoryStore = {
  async getAll(): Promise<Memory[]> {
    try {
      return await db.memories.toArray();
    } catch (error) {
      console.error("Failed to get all memories:", error);
      return [];
    }
  },

  async save(memory: Memory): Promise<void> {
    try {
      await db.memories.put(memory);
    } catch (error) {
      console.error("Failed to save memory:", error);
    }
  },

  async bulkSave(memories: Memory[]): Promise<void> {
      try {
          await db.memories.bulkPut(memories);
      } catch (error) {
          console.error("Failed to bulk save memories:", error);
      }
  },

  async deleteById(id: string): Promise<void> {
    try {
      await db.memories.delete(id);
    } catch (error) {
      console.error("Failed to delete memory:", error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await db.memories.clear();
    } catch (error) {
      console.error("Failed to clear memories:", error);
    }
  },
};
