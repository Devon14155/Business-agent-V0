// Fix: Import Jest globals to resolve errors like "Cannot find name 'describe'".
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { generateChatResponse } from './chatUseCase';
import * as geminiService from '../services/geminiService';
import * as memoryManager from '../memory/memoryManager';
import * as toolRegistry from '../functions/toolRegistry';
import { ChatMessage } from '../types';

// Mock dependencies
// Fix: Use jest.mock() which is now available.
jest.mock('../services/geminiService');
jest.mock('../memory/memoryManager');
jest.mock('../functions/toolRegistry');

const mockedGetChatResponse = geminiService.getChatResponse as jest.Mock;
const mockedAnalyzeImage = geminiService.analyzeImage as jest.Mock;
const mockedGetRecentMemories = memoryManager.memoryManager.getRecentMemoriesForContext as jest.Mock;
const mockedExecuteFunctionCall = toolRegistry.executeFunctionCall as jest.Mock;

// Fix: Use describe() which is now available.
describe('chatUseCase', () => {
  // Fix: Use beforeEach() which is now available.
  beforeEach(() => {
    // Fix: Use jest.clearAllMocks() which is now available.
    jest.clearAllMocks();
  });

  // Fix: Use it() which is now available.
  it('should call analyzeImage for image attachments', async () => {
    mockedAnalyzeImage.mockResolvedValue('This is an image of a cat.');

    const userMessage: ChatMessage = {
      sender: 'user',
      text: 'What is this?',
      attachment: {
        name: 'cat.jpg',
        type: 'image/jpeg',
        file: new File([''], 'cat.jpg', { type: 'image/jpeg' }),
      },
    };

    const result = await generateChatResponse([], userMessage, {});
    // Fix: Use expect() which is now available.
    expect(mockedAnalyzeImage).toHaveBeenCalledWith('What is this?', userMessage.attachment?.file);
    expect(result.message.text).toBe('This is an image of a cat.');
    expect(mockedGetChatResponse).not.toHaveBeenCalled();
  });

  // Fix: Use it() which is now available.
  it('should get recent memories and call geminiService for a text message', async () => {
    mockedGetRecentMemories.mockResolvedValue([]);
    mockedGetChatResponse.mockResolvedValue({ text: 'Hello back!' });

    const userMessage: ChatMessage = { sender: 'user', text: 'Hello' };
    const history: ChatMessage[] = [];

    await generateChatResponse(history, userMessage, { deepThinking: true });

    // Fix: Use expect() which is now available.
    expect(mockedGetRecentMemories).toHaveBeenCalled();
    expect(mockedGetChatResponse).toHaveBeenCalledWith(
      [{ role: 'user', parts: [{ text: 'Hello' }] }], // geminiHistory
      expect.objectContaining({
        deepThinking: true,
        memories: [],
      })
    );
  });
  
  // Fix: Use it() which is now available.
  it('should execute a function call when returned by the model', async () => {
    const functionCall = { name: 'addMemory', args: { content: 'test', type: 'Context' } };
    mockedGetChatResponse.mockResolvedValue({
      text: '',
      functionCalls: [functionCall],
      candidates:[],
    });
    mockedExecuteFunctionCall.mockReturnValue({
      functionResponse: { name: 'addMemory', response: { result: 'ok' } },
    });

    const userMessage: ChatMessage = { sender: 'user', text: 'Remember this' };
    const result = await generateChatResponse([], userMessage, {});

    // Fix: Use expect() which is now available.
    expect(mockedExecuteFunctionCall).toHaveBeenCalledWith(functionCall);
    expect(result.message.sender).toBe('bot');
    expect(result.message.functionCall).toEqual(functionCall);
    expect(result.message.functionResponse).toBeDefined();
    expect(result.message.functionResponse?.response.result).toBe('ok');
  });
});
