import { getCanvasSuggestions } from '../services/geminiService';
import { CanvasItem, CanvasState } from '../types';
import { storageService } from '../storage/storageService';

export const getAiCanvasSuggestions = async (projectName: string, canvasItems: { title: string, content: string }[]): Promise<string> => {
    return getCanvasSuggestions(projectName, canvasItems);
};

export const saveCanvasData = async (projectName: string, items: Omit<CanvasItem, 'icon'>[]): Promise<void> => {
    const dataToSave: CanvasState = {
        id: 'main_canvas',
        name: projectName,
        items: items,
    };
    await storageService.saveCanvasData(dataToSave);
};

export const loadCanvasData = async (): Promise<CanvasState | undefined> => {
    return storageService.getCanvasData();
};