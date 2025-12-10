import { GoogleGenAI, GenerateContentResponse, GroundingChunk, Part, Type, FunctionDeclaration, Content } from "@google/genai";
import { GroundingSource, Memory, CompetitiveAnalysisResult } from '../types';
import { observabilityService } from './observabilityService';

// Per guidelines, the API client must be initialized with process.env.API_KEY.
// The key's availability is handled externally. Storing keys in localStorage
// or providing UI to set them is not permitted.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// Utility to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

interface ChatOptions {
    deepThinking?: boolean;
    researchMode?: boolean;
    tools?: FunctionDeclaration[];
    memories?: Memory[];
}

export const getChatResponse = async (
    history: Content[],
    options: ChatOptions = {}
): Promise<GenerateContentResponse> => {
    try {
        const modelName = options.deepThinking ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
        
        // --- Proactive Memory Integration ---
        let systemInstruction = "You are a world-class business professor and execution partner.";
        if (options.memories && options.memories.length > 0) {
            systemInstruction += "\n\nHere is some context about the user's goals and preferences. Keep this in mind when responding:\n";
            options.memories.forEach(mem => {
                systemInstruction += `- ${mem.type}: ${mem.content}\n`;
            });
        }
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: modelName,
            contents: history,
            config: {
                systemInstruction,
                tools: options.researchMode 
                    ? [{googleSearch: {}}] 
                    : (options.tools ? [{functionDeclarations: options.tools}] : undefined),
                thinkingConfig: options.deepThinking ? undefined : { thinkingBudget: 0 },
            },
        });
        
        return response;

    } catch (error) {
        console.error("Error getting chat response:", error);
        if (error instanceof Error) {
            observabilityService.logError(error, { context: 'getChatResponse' });
        }
        // Return a response object that looks like a valid Gemini response with an error message
        // Fix: Use a type assertion to satisfy the GenerateContentResponse type for the error case.
        return {
            text: "Sorry, I encountered an error. This could be due to an invalid API key or a network issue. Please check your settings.",
            candidates: [],
            functionCalls: []
        } as GenerateContentResponse;
    }
};

export const getCanvasSuggestions = async (canvasTitle: string, canvasItems: { title: string, content: string }[]): Promise<string> => {
    const prompt = `
      You are a world-class business strategist. I am building a business plan using a Lean Canvas.
      The project is called "${canvasTitle}".
      Here is the current state of my canvas:
      ${canvasItems.map(item => `
      - ${item.title}: ${item.content || 'Not filled yet.'}
      `).join('')}

      Based on the information provided, please provide concise, actionable suggestions to improve or complete this canvas.
      Focus on the areas that are empty or weak. Provide your feedback in a structured markdown format.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error("Error getting canvas suggestions:", error);
        if (error instanceof Error) {
            observabilityService.logError(error, { context: 'getCanvasSuggestions' });
        }
        return "An error occurred while generating suggestions. This could be due to an invalid API key or a network issue. Please check your settings.";
    }
};


export const getCompetitiveAnalysis = async (query: string): Promise<{ result: CompetitiveAnalysisResult | null, sources: GroundingSource[] }> => {
    try {
        const jsonSchemaForPrompt = `
{
  "type": "OBJECT",
  "properties": {
    "keyPlayers": {
      "type": "ARRAY",
      "items": {
        "type": "OBJECT",
        "properties": {
          "name": { "type": "STRING" },
          "description": { "type": "STRING" },
          "strengths": { "type": "ARRAY", "items": { "type": "STRING" } },
          "weaknesses": { "type": "ARRAY", "items": { "type": "STRING" } }
        },
        "required": ["name", "description", "strengths", "weaknesses"]
      }
    },
    "marketTrends": { "type": "ARRAY", "items": { "type": "STRING" } },
    "potentialOpportunities": { "type": "ARRAY", "items": { "type": "STRING" } }
  },
  "required": ["keyPlayers", "marketTrends", "potentialOpportunities"]
}`;

        const prompt = `Provide a detailed competitive landscape analysis for the following topic: "${query}". Respond ONLY with a valid JSON object that conforms to the following schema. Do not include any other text or markdown formatting. \n\nSchema:\n${jsonSchemaForPrompt}`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        let result: CompetitiveAnalysisResult | null = null;
        try {
            // The response may be wrapped in markdown backticks
            const jsonText = response.text.trim().replace(/^```json\n?/, '').replace(/```$/, '');
            result = JSON.parse(jsonText);
        } catch (e) {
            console.error("Failed to parse JSON response for competitive analysis:", e, "Response text:", response.text);
             if (e instanceof Error) {
                observabilityService.logError(e, { context: 'getCompetitiveAnalysis-JSON-Parsing', responseText: response.text });
            }
            // If parsing fails, we'll return null for the result, and the UI will show an error.
        }
        
        const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        const sources: GroundingSource[] = rawChunks
            .map((chunk: GroundingChunk) => chunk.web)
            .filter(web => web && web.uri)
            .map(web => ({ title: web!.title || web!.uri!, uri: web!.uri! }));

        return { result, sources };
    } catch (error) {
        console.error("Error getting competitive analysis:", error);
        if (error instanceof Error) {
            observabilityService.logError(error, { context: 'getCompetitiveAnalysis' });
        }
        return { result: null, sources: [] };
    }
};

export const analyzeImage = async (prompt: string, imageFile: File): Promise<string> => {
    try {
        const base64Image = await fileToBase64(imageFile);
        const imagePart = {
            inlineData: { mimeType: imageFile.type, data: base64Image },
        };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, imagePart] },
        });
        
        return response.text;
    } catch (error) {
        console.error("Error analyzing image:", error);
         if (error instanceof Error) {
            observabilityService.logError(error, { context: 'analyzeImage' });
        }
        return "Sorry, I was unable to analyze the image. This could be due to an invalid API key or a network issue. Please check your settings.";
    }
};

export const analyzeFinancialModel = async (inputs: any, projections: any): Promise<string> => {
    const prompt = `
        You are an expert financial analyst for startups. I have a business model and financial projections. Please provide a concise analysis.

        Assumptions:
        - Initial Investment: $${inputs.initialInvestment.toLocaleString()}
        - Monthly User Growth: ${inputs.monthlyUserGrowth}%
        - Conversion Rate: ${inputs.conversionRate}%
        - ARPU: $${inputs.arpu}
        - COGS: ${inputs.cogsPercentage}% of Revenue
        - Monthly OpEx (Marketing, Salaries, Software): $${(inputs.marketingSpend + inputs.salaries + inputs.softwareCosts).toLocaleString()}

        Key Projection Results:
        - Projected Runway: ${projections.kpiData.find((k: any) => k.label === 'Projected Runway')?.value}
        - Break-Even Point: ${projections.kpiData.find((k: any) => k.label === 'Break-Even Point')?.value}
        - Average Burn Rate: ${projections.kpiData.find((k: any) => k.label === 'Avg. Burn Rate')?.value}

        Based on this data, provide:
        1.  **Executive Summary:** A brief, high-level overview of the financial situation.
        2.  **Key Risks:** Identify the 2-3 biggest risks in this model (e.g., high burn rate, dependency on growth, low margins). Be specific.
        3.  **Potential Opportunities:** Suggest 2-3 actionable opportunities for improvement (e.g., "Increasing ARPU by just $5 could extend runway by 2 months.").

        Present your analysis in clear, structured markdown.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing financial model:", error);
        if (error instanceof Error) {
            observabilityService.logError(error, { context: 'analyzeFinancialModel' });
        }
        return "An error occurred while analyzing the model. Please check your API key and network connection.";
    }
};

export const generateCustomTemplate = async (prompt: string): Promise<string> => {
    const fullPrompt = `
        You are a tool that generates business templates in Markdown format.
        The user has requested a template for the following purpose: "${prompt}".

        Generate a comprehensive and well-structured Markdown template that is ready to use.
        Include clear headings, bullet points, and placeholder text where appropriate.
        Do not include any conversational text or explanations outside of the template itself.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt
        });
        return response.text;
    } catch (error) {
        console.error("Error generating custom template:", error);
        if (error instanceof Error) {
            observabilityService.logError(error, { context: 'generateCustomTemplate' });
        }
        return "Error: Could not generate the template. Please check your API key and try again.";
    }
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
            },
        });

        const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;

        if (base64ImageBytes) {
            return base64ImageBytes;
        }
        throw new Error("The model did not return an image.");

    } catch (error) {
        console.error("Error generating image:", error);
        if (error instanceof Error) {
            // Log the error before re-throwing it for the UI to handle.
            observabilityService.logError(error, { context: 'generateImage' });
            throw new Error(`Image generation failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred during image generation.");
    }
};
