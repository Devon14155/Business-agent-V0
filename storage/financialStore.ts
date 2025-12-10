import { db } from './db';
import { FinancialModelState } from '../types';

const MODEL_ID = 'main_model';

export const financialStore = {
  async get(): Promise<FinancialModelState | undefined> {
    try {
      return await db.financialModels.get(MODEL_ID);
    } catch (error) {
      console.error("Failed to get financial model:", error);
      return undefined;
    }
  },

  async save(modelState: FinancialModelState): Promise<void> {
    try {
      await db.financialModels.put(modelState);
    } catch (error) {
      console.error("Failed to save financial model:", error);
    }
  },

  async clearAll(): Promise<void> {
      try {
          await db.financialModels.clear();
      } catch (error) {
          console.error("Failed to clear financial models:", error);
      }
  }
};
