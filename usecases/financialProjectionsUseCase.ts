import { analyzeFinancialModel } from '../services/geminiService';
import { storageService } from '../storage/storageService';
import { FinancialModelState } from '../types';


export const getFinancialModelAnalysis = async (inputs: any, projections: any): Promise<string> => {
    return analyzeFinancialModel(inputs, projections);
};

export const saveFinancialModel = async (inputs: any): Promise<void> => {
    const modelState: FinancialModelState = {
        id: 'main_model',
        inputs: inputs,
    };
    await storageService.saveFinancialModel(modelState);
};

export const loadFinancialModel = async <T,>(defaultValue: T): Promise<T> => {
    const modelState = await storageService.getFinancialModel();
    return modelState?.inputs || defaultValue;
};