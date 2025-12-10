// Fix: Import Jest globals to resolve errors like "Cannot find name 'describe'".
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getChatResponse } from './geminiService';
import { GoogleGenAI } from '@google/genai';
// Fix: Import Memory type to correctly type the test data.
import { Memory } from '../types';

// Mock the entire @google/genai module
// Fix: Use jest.fn() which is now available.
const mockGenerateContent = jest.fn();
// Fix: Use jest.fn() which is now available.
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

// Fix: Use describe() which is now available.
describe('geminiService', () => {
  // Fix: Use beforeEach() which is now available.
  beforeEach(() => {
    // Clear mock history before each test
    mockGenerateContent.mockClear();
    (GoogleGenAI as jest.Mock).mockClear();
  });

  // Fix: Use it() which is now available.
  it('should call generateContent with gemini-2.5-flash by default', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'Hello there' });
    await getChatResponse([{ role: 'user', parts: [{ text: 'Hi' }] }]);
    // Fix: Use expect() which is now available.
    expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-2.5-flash',
    }));
  });

  // Fix: Use it() which is now available.
  it('should use gemini-2.5-pro when deepThinking is true', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'Thinking deeply...' });
    await getChatResponse([], { deepThinking: true });
    // Fix: Use expect() which is now available.
    expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-2.5-pro',
    }));
  });

  // Fix: Use it() which is now available.
  it('should include googleSearch tool when researchMode is true', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'Researching...' });
    await getChatResponse([], { researchMode: true });
    // Fix: Use expect() which is now available.
    expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
      config: expect.objectContaining({
        tools: [{ googleSearch: {} }],
      }),
    }));
  });

  // Fix: Use it() which is now available.
  it('should construct systemInstruction with memories', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'I remember' });
    // Fix: Explicitly type the `memories` array to match the `Memory[]` type expected by the function.
    const memories: Memory[] = [{ id: '1', type: 'Goals', content: 'Test goal', createdAt: '' }];
    await getChatResponse([], { memories });
    // Fix: Use expect() which is now available.
    expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
      config: expect.objectContaining({
        systemInstruction: expect.stringContaining("Test goal"),
      }),
    }));
  });

  // Fix: Use it() which is now available.
  it('should handle API errors gracefully', async () => {
    const error = new Error('API Key Invalid');
    mockGenerateContent.mockRejectedValue(error);
    const response = await getChatResponse([]);
    // Fix: Use expect() which is now available.
    expect(response.text).toContain('Sorry, I encountered an error.');
  });
});
