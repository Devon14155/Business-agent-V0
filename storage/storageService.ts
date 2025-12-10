import * as constants from '../config/constants';
import { memoryStore } from './memoryStore';
import { canvasStore } from './canvasStore';
import { financialStore } from './financialStore';
import { settingsStore } from './settingsStore';
import { chatHistoryStore } from './chatHistoryStore';
import { Memory, CanvasState, FinancialModelState, ChatSession } from '../types';
import { observabilityService } from '../services/observabilityService';

let isInitialized = false;

// --- MIGRATION LOGIC ---
const migrateFromLocalStorage = async () => {
    console.log("Checking for data to migrate from localStorage...");
    try {
        // Migrate Memories
        const oldMemories = localStorage.getItem(constants.MEMORY_STORAGE_KEY);
        if (oldMemories) {
            const memories: Memory[] = JSON.parse(oldMemories);
            if (Array.isArray(memories) && memories.length > 0) {
                await memoryStore.bulkSave(memories);
                localStorage.removeItem(constants.MEMORY_STORAGE_KEY);
                console.log(`Migrated ${memories.length} memories to IndexedDB.`);
            }
        }

        // Migrate Canvas
        const oldCanvas = localStorage.getItem(constants.CANVAS_STORAGE_key);
        if (oldCanvas) {
            const canvasData = JSON.parse(oldCanvas);
            if (canvasData && canvasData.name && canvasData.items) {
                const canvasState: CanvasState = { id: 'main_canvas', ...canvasData };
                await canvasStore.save(canvasState);
                localStorage.removeItem(constants.CANVAS_STORAGE_key);
                 console.log(`Migrated canvas data to IndexedDB.`);
            }
        }

        // Migrate Financial Model
        const oldModel = localStorage.getItem(constants.MODEL_STORAGE_KEY);
        if (oldModel) {
            const modelInputs = JSON.parse(oldModel);
            if (modelInputs) {
                const modelState: FinancialModelState = { id: 'main_model', inputs: modelInputs };
                await financialStore.save(modelState);
                localStorage.removeItem(constants.MODEL_STORAGE_KEY);
                console.log(`Migrated financial model to IndexedDB.`);
            }
        }

        // Migrate Theme
        const oldTheme = localStorage.getItem(constants.THEME_STORAGE_KEY);
        if (oldTheme) {
            await settingsStore.save({ key: constants.THEME_STORAGE_KEY, value: oldTheme });
            localStorage.removeItem(constants.THEME_STORAGE_KEY);
            console.log(`Migrated theme to IndexedDB.`);
        }

        localStorage.setItem(constants.MIGRATION_STORAGE_KEY, 'true');
        console.log("Migration complete.");
    } catch (error) {
        console.error("Error during data migration:", error);
        if (error instanceof Error) {
            observabilityService.logError(error, { context: 'migrateFromLocalStorage' });
        }
    }
};


// --- PUBLIC API ---
export const storageService = {
    initialize: async (): Promise<void> => {
        if (isInitialized) return;
        const isMigrated = localStorage.getItem(constants.MIGRATION_STORAGE_KEY);
        if (!isMigrated) {
            await migrateFromLocalStorage();
        }
        isInitialized = true;
    },

    // --- Memories ---
    getAllMemories: memoryStore.getAll,
    addMemory: memoryStore.save,
    updateMemory: memoryStore.save,
    deleteMemory: memoryStore.deleteById,
    purgeAllMemories: memoryStore.clearAll,

    // --- Canvas ---
    getCanvasData: canvasStore.get,
    saveCanvasData: canvasStore.save,

    // --- Financial Model ---
    getFinancialModel: financialStore.get,
    saveFinancialModel: financialStore.save,

    // --- Chat History ---
    getAllChatSessions: chatHistoryStore.getAll,
    getChatSession: chatHistoryStore.get,
    saveChatSession: chatHistoryStore.save,
    deleteChatSession: chatHistoryStore.deleteById,
    purgeAllChatHistory: chatHistoryStore.clearAll,

    // --- Settings (Theme) ---
    getTheme: async (): Promise<'light' | 'dark'> => {
        const setting = await settingsStore.get(constants.THEME_STORAGE_KEY);
        // Fix: Explicitly validate the theme value from storage to satisfy the return type.
        const value = setting?.value;
        if (value === 'dark' || value === 'light') {
            return value;
        }
        return 'light';
    },
    setTheme: (theme: 'light' | 'dark'): Promise<void> => {
        return settingsStore.save({ key: constants.THEME_STORAGE_KEY, value: theme });
    },

    // --- Data Management ---
    exportAllData: async (): Promise<object> => {
        const [memories, canvas, financialModel, settings, chatHistory] = await Promise.all([
            memoryStore.getAll(),
            canvasStore.get(),
            financialStore.get(),
            settingsStore.getAll(),
            chatHistoryStore.getAll(),
        ]);
        return { memories, canvas, financialModel, settings, chatHistory };
    },
    resetAllData: async (): Promise<void> => {
        await Promise.all([
            memoryStore.clearAll(),
            canvasStore.clearAll(),
            financialStore.clearAll(),
            chatHistoryStore.clearAll(),
            // We keep settings like theme
        ]);
    },
};
