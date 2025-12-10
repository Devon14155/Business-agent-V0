import { generateCustomTemplate } from '../services/geminiService';

export const generateAiTemplate = async (prompt: string): Promise<string> => {
    return generateCustomTemplate(prompt);
};
