// Fix: Import Jest globals to resolve errors like "Cannot find name 'describe'".
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { memoryManager } from './memoryManager';
import { storageService } from '../storage/storageService';
import { Memory } from '../types';

// Fix: Use jest.mock() which is now available.
jest.mock('../storage/storageService');

const mockedStorage = storageService as jest.Mocked<typeof storageService>;

// Fix: Use describe() which is now available.
describe('memoryManager', () => {
  // Fix: Use beforeEach() which is now available.
  beforeEach(() => {
    // Fix: Use jest.clearAllMocks() which is now available.
    jest.clearAllMocks();
  });

  // Fix: Use it() which is now available.
  it('addMemory should create an ID and timestamp and call storage', async () => {
    await memoryManager.addMemory({ content: 'test content', type: 'Goals' });

    // Fix: Use expect() which is now available.
    expect(mockedStorage.addMemory).toHaveBeenCalledTimes(1);
    expect(mockedStorage.addMemory).toHaveBeenCalledWith(expect.objectContaining({
      content: 'test content',
      type: 'Goals',
      id: expect.any(String),
      createdAt: expect.any(String),
    }));
  });

  // Fix: Use it() which is now available.
  it('updateMemory should find the memory and call storage with updated values', async () => {
    const existingMemories: Memory[] = [
      { id: '123', content: 'old content', type: 'Context', createdAt: new Date().toISOString() },
    ];
    mockedStorage.getAllMemories.mockResolvedValue(existingMemories);

    await memoryManager.updateMemory('123', 'new content', 'Preferences');

    // Fix: Use expect() which is now available.
    expect(mockedStorage.updateMemory).toHaveBeenCalledWith({
      id: '123',
      content: 'new content',
      type: 'Preferences',
      createdAt: existingMemories[0].createdAt,
    });
  });

  // Fix: Use it() which is now available.
  it('deleteMemory should call storage with the correct ID', async () => {
    await memoryManager.deleteMemory('abc');
    // Fix: Use expect() which is now available.
    expect(mockedStorage.deleteMemory).toHaveBeenCalledWith('abc');
  });

  // Fix: Use it() which is now available.
  it('getRecentMemoriesForContext should filter and sort memories', async () => {
    const allMemories: Memory[] = [
      { id: '1', type: 'History', content: 'a', createdAt: new Date(2023, 1, 1).toISOString() },
      { id: '2', type: 'Goals', content: 'b', createdAt: new Date(2023, 1, 3).toISOString() },
      { id: '3', type: 'Context', content: 'c', createdAt: new Date(2023, 1, 2).toISOString() },
    ];
    mockedStorage.getAllMemories.mockResolvedValue(allMemories);

    const result = await memoryManager.getRecentMemoriesForContext();

    // Should return Goals and Context, sorted by date descending
    // Fix: Use expect() which is now available.
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('2'); // Most recent
    expect(result[1].id).toBe('3');
  });
});
