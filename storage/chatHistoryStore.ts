import { db } from './db';
import { ChatSession } from '../types';

export const chatHistoryStore = {
  async getAll(): Promise<ChatSession[]> {
    try {
      // Order by most recent first
      return await db.chatSessions.orderBy('timestamp').reverse().toArray();
    } catch (error) {
      console.error("Failed to get all chat sessions:", error);
      return [];
    }
  },

  async get(id: string): Promise<ChatSession | undefined> {
    try {
        return await db.chatSessions.get(id);
    } catch (error) {
        console.error(`Failed to get chat session with id "${id}":`, error);
        return undefined;
    }
  },

  async save(session: ChatSession): Promise<void> {
    try {
      await db.chatSessions.put(session);
    } catch (error) {
      console.error("Failed to save chat session:", error);
    }
  },

  async deleteById(id: string): Promise<void> {
    try {
      await db.chatSessions.delete(id);
    } catch (error) {
      console.error("Failed to delete chat session:", error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await db.chatSessions.clear();
    } catch (error) {
      console.error("Failed to clear chat history:", error);
    }
  },
};