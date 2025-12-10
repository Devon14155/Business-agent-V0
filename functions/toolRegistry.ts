import { FunctionDeclaration, Type, Part, FunctionCall } from '@google/genai';
import { memoryManager } from '../memory/memoryManager';
import { Memory } from '../types';

export const addMemoryTool: FunctionDeclaration = {
    name: 'addMemory',
    parameters: {
        type: Type.OBJECT,
        description: "Saves a piece of information to the user's memory for future reference.",
        properties: {
            content: {
                type: Type.STRING,
                description: "The content of the memory to save.",
            },
            type: {
                type: Type.STRING,
                description: "The category of the memory.",
                enum: ['Goals', 'Preferences', 'Context', 'Decisions', 'History']
            },
        },
        required: ["content", "type"]
    }
};

export const availableTools = [addMemoryTool];

export const executeFunctionCall = (functionCall: FunctionCall): Part => {
    if (functionCall.name === 'addMemory') {
        const { content, type } = functionCall.args as { content: string, type: Memory['type'] };
        try {
            if (!content || !type) {
                throw new Error("Missing content or type for addMemory tool.");
            }
            memoryManager.addMemory({ content, type });
            return { functionResponse: { name: 'addMemory', response: { result: "ok" } } };
        } catch (e) {
            console.error("Error executing addMemory function call:", e);
            return { functionResponse: { name: 'addMemory', response: { result: "error saving memory" } } };
        }
    }
    console.warn(`Unknown function call received: ${functionCall.name}`);
    return { functionResponse: { name: functionCall.name, response: { result: "unknown function" } } };
};
