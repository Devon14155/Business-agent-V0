// Fix: Import React to resolve the "Cannot find namespace 'React'" error.
import type React from 'react';
import type { FunctionCall, FunctionResponse } from '@google/genai';

export type View = 'chat' | 'canvas' | 'competitor-scanner' | 'image-generator' | 'financial-projections' | 'template-library' | 'memory-management' | 'settings';

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  sources?: GroundingSource[];
  attachment?: {
    name: string;
    type: string;
    previewUrl?: string; // For image previews
    file?: File; // Keep the original file for sending
  };
  functionCall?: FunctionCall;
  functionResponse?: FunctionResponse;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: string; // ISO string
  messages: ChatMessage[];
}

export interface CanvasItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: string;
}

// For IndexedDB storage
export interface CanvasState {
  id: 'main_canvas'; // Use a single, constant key
  name: string;
  items: Omit<CanvasItem, 'icon'>[];
}


export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Memory {
  id: string;
  content: string;
  type: 'Goals' | 'Preferences' | 'Context' | 'Decisions' | 'History';
  createdAt: string; // ISO string
}

export interface CompetitiveAnalysisResult {
    keyPlayers: Array<{
        name: string;
        description: string;
        strengths: string[];
        weaknesses: string[];
    }>;
    marketTrends: string[];
    potentialOpportunities: string[];
}

// For IndexedDB key-value storage
export interface Setting<T = any> {
    key: string;
    value: T;
}

export interface FinancialModelState {
    id: 'main_model'; // Use a single, constant key
    inputs: any;
}