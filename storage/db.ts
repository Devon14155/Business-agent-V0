import Dexie, { type Table } from 'dexie';
import type { Memory, CanvasState, FinancialModelState, Setting, ChatSession } from '../types';

// By creating a typed instance of Dexie instead of subclassing,
// we avoid potential module resolution issues with 'this' context in the constructor
// that can cause TypeScript errors like "property 'version' does not exist".
export const db = new Dexie('AIPocketExpertDB') as Dexie & {
  memories: Table<Memory, string>;
  canvas: Table<CanvasState, string>;
  financialModels: Table<FinancialModelState, string>;
  settings: Table<Setting, string>;
  chatSessions: Table<ChatSession, string>;
};

db.version(1).stores({
  memories: 'id, type, createdAt', // Primary key 'id', index on 'type' and 'createdAt'
  canvas: 'id', // Primary key is 'id'
  financialModels: 'id', // Primary key is 'id'
  settings: 'key', // Primary key is 'key'
  chatSessions: 'id, timestamp', // Primary key 'id', index on 'timestamp'
});
