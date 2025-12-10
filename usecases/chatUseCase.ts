import { Content, GenerateContentResponse, FunctionCall } from '@google/genai';
import { ChatMessage } from '../types';
import { getChatResponse, analyzeImage } from '../services/geminiService';
import { memoryManager } from '../memory/memoryManager';
import { availableTools, executeFunctionCall } from '../functions/toolRegistry';

export interface ChatResponse {
    message: ChatMessage;
}

export interface ChatOptions {
    deepThinking?: boolean;
    researchMode?: boolean;
}

export const generateChatResponse = async (
    history: ChatMessage[],
    userMessage: ChatMessage,
    options: ChatOptions
): Promise<ChatResponse> => {
    
    // Handle image analysis separately
    if (userMessage.attachment?.file && userMessage.attachment.type.startsWith('image/')) {
        const botResponseText = await analyzeImage(userMessage.text, userMessage.attachment.file);
        return {
            message: { sender: 'bot', text: botResponseText }
        };
    }

    const recentMemories = await memoryManager.getRecentMemoriesForContext();

    // Convert ChatMessage[] history to Gemini's Content[]
    const geminiHistory: Content[] = history.flatMap(msg => {
        // Skip function responses here, as they are part of a turn with the call
        if(msg.functionResponse) return [];

        const content: Content = {
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: []
        };
        
        if (msg.text) {
            content.parts.push({ text: msg.text });
        }
        
        // Re-construct function call history for the model
        if(msg.functionCall) {
            content.parts = [{ functionCall: msg.functionCall }];
            // Find the subsequent function response to form a complete turn
            const responseMsg = history.find(h => h.functionResponse?.name === msg.functionCall?.name);
            if(responseMsg) {
                return [
                    content, // model part with functionCall
                    { role: 'user', parts: [{ functionResponse: responseMsg.functionResponse }]}
                ];
            }
        }
        return [content];
    });
    
    // Add the current user message, unless it's an empty one for triggering a function response
    if (userMessage.text) {
        geminiHistory.push({ role: 'user', parts: [{ text: userMessage.text }]});
    }

    try {
        let response = await getChatResponse(geminiHistory, {
            ...options,
            tools: availableTools,
            memories: recentMemories
        });

        // Handle Function Calling
        if (response.functionCalls && response.functionCalls.length > 0) {
            const functionCall = response.functionCalls[0];
            const functionResponsePart = await executeFunctionCall(functionCall);

            return {
                message: {
                    sender: 'bot',
                    text: '', // No text is sent, just the function call
                    functionCall: functionCall,
                    functionResponse: functionResponsePart.functionResponse,
                }
            };
        }

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => c.web).filter(Boolean).map(w => ({ title: w!.title || w!.uri!, uri: w!.uri! })) || [];

        return {
            message: { sender: 'bot', text: response.text, sources }
        };

    } catch (error) {
        console.error("Error in chat use case:", error);
        return {
            message: { sender: 'bot', text: "Sorry, an unexpected error occurred." }
        };
    }
};