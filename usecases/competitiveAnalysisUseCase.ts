import { getCompetitiveAnalysis } from '../services/geminiService';
import { CompetitiveAnalysisResult, GroundingSource } from '../types';

export const performCompetitiveAnalysis = async (query: string): Promise<{ result: CompetitiveAnalysisResult | null, sources: GroundingSource[] }> => {
    return getCompetitiveAnalysis(query);
};
