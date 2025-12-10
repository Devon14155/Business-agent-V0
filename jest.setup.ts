// jest.setup.ts
// Mocks for browser APIs not present in JSDOM.
// This file would be configured in a jest.config.js file under `setupFilesAfterEnv`.

// Fix: Import jest from @jest/globals to make it available in this setup file.
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock SpeechRecognition API
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;
  // Fix: Use jest.fn() to create mock functions.
  start = jest.fn();
  stop = jest.fn();
}
// Fix: Use `globalThis` instead of `global` for broader environment compatibility (browser, worker, node).
(globalThis as any).SpeechRecognition = MockSpeechRecognition;
(globalThis as any).webkitSpeechRecognition = MockSpeechRecognition;

// Mock URL.createObjectURL for handling file attachments in tests
if (typeof window.URL.createObjectURL === 'undefined') {
  // Fix: Use jest.fn() to create mock functions.
  Object.defineProperty(window.URL, 'createObjectURL', { value: (obj: any) => `blob:${obj?.name || 'mock'}` });
  Object.defineProperty(window.URL, 'revokeObjectURL', { value: jest.fn() });
}

// Mock IntersectionObserver, used by some UI libraries implicitly
// Fix: Use jest.fn() to create mock functions.
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock scrollIntoView, which is not implemented in JSDOM
// Fix: Use jest.fn() to create mock functions.
window.HTMLElement.prototype.scrollIntoView = jest.fn();
