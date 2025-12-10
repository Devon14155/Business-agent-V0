import { Memory } from '../types';
import { storageService } from '../storage/storageService';

// The memory manager is now a stateless service that interacts with the async storage layer.
export const memoryManager = {
    getAllMemories: (): Promise<Memory[]> => {
        return storageService.getAllMemories();
    },

    addMemory: async (newMemoryData: Omit<Memory, 'id' | 'createdAt'>): Promise<Memory> => {
        const newMemory: Memory = {
            ...newMemoryData,
            id: Date.now().toString(36) + Math.random().toString(36).substring(2),
            createdAt: new Date().toISOString()
        };
        await storageService.addMemory(newMemory);
        return newMemory;
    },

    updateMemory: async (id: string, content: string, type: Memory['type']): Promise<void> => {
        const memories = await storageService.getAllMemories();
        const memoryToUpdate = memories.find(mem => mem.id === id);
        if (memoryToUpdate) {
            const updatedMemory = { ...memoryToUpdate, content, type };
            await storageService.updateMemory(updatedMemory);
        }
    },

    deleteMemory: (id: string): Promise<void> => {
        return storageService.deleteMemory(id);
    },

    purgeAll: (): Promise<void> => {
        return storageService.purgeAllMemories();
    },

    getRecentMemoriesForContext: async (count: number = 5): Promise<Memory[]> => {
        const allMemories = await storageService.getAllMemories();
        return allMemories
            .filter(m => m.type === 'Goals' || m.type === 'Preferences' || m.type === 'Context')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, count);
    }
};