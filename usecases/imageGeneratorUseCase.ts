import { generateImage } from '../services/geminiService';

export const generateAiImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const base64Bytes = await generateImage(prompt, aspectRatio);
    return `data:image/jpeg;base64,${base64Bytes}`;
};
