import { db } from './db';
import { CanvasState } from '../types';

const CANVAS_ID = 'main_canvas';

export const canvasStore = {
  async get(): Promise<CanvasState | undefined> {
    try {
      return await db.canvas.get(CANVAS_ID);
    } catch (error) {
      console.error("Failed to get canvas data:", error);
      return undefined;
    }
  },

  async save(canvasState: CanvasState): Promise<void> {
    try {
      await db.canvas.put(canvasState);
    } catch (error) {
      console.error("Failed to save canvas data:", error);
    }
  },

  async clearAll(): Promise<void> {
      try {
          await db.canvas.clear();
      } catch (error) {
          console.error("Failed to clear canvas data:", error);
      }
  }
};
