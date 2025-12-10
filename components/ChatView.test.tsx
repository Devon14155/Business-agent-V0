// Fix: Import Jest globals to resolve errors like "Cannot find name 'describe'".
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatView from './ChatView';
import * as chatUseCase from '../usecases/chatUseCase';
import * as storageService from '../storage/storageService';
import { ChatSession } from '../types';

// Mock the dependencies
// Fix: Use jest.mock() which is now available.
jest.mock('../usecases/chatUseCase');
jest.mock('../storage/storageService');

const mockedGenerateChatResponse = chatUseCase.generateChatResponse as jest.Mock;
const mockedSaveChatSession = storageService.storageService.saveChatSession as jest.Mock;
const mockedGetChatSession = storageService.storageService.getChatSession as jest.Mock;
const mockedGetAllChatSessions = storageService.storageService.getAllChatSessions as jest.Mock;

// Fix: Use describe() which is now available.
describe('ChatView', () => {
    // Fix: Use beforeEach() which is now available.
    beforeEach(() => {
        // Fix: Use jest.clearAllMocks() which is now available.
        jest.clearAllMocks();
        mockedGenerateChatResponse.mockResolvedValue({
            message: { sender: 'bot', text: 'Mocked response' },
        });
        mockedSaveChatSession.mockResolvedValue(undefined);
        mockedGetChatSession.mockResolvedValue(undefined);
        mockedGetAllChatSessions.mockResolvedValue([]);
    });

    // Fix: Use it() which is now available.
    it('renders the initial greeting message', () => {
        render(<ChatView />);
        // Fix: Use expect() which is now available.
        expect(screen.getByText(/Hello! I'm your AI business expert/)).toBeInTheDocument();
    });

    // Fix: Use it() which is now available.
    it('allows user to type and send a message', async () => {
        render(<ChatView />);
        
        const input = screen.getByPlaceholderText('Ask a question...');
        const sendButton = screen.getByLabelText('Send message');

        // Type a message
        fireEvent.change(input, { target: { value: 'Hello AI' } });
        // Fix: Use expect() which is now available.
        expect(input).toHaveValue('Hello AI');

        // Send the message
        fireEvent.click(sendButton);

        // User message should appear immediately
        // Fix: Use expect() which is now available.
        expect(screen.getByText('Hello AI')).toBeInTheDocument();
        
        // Input should be cleared
        expect(input).toHaveValue('');

        // The chat use case should be called
        expect(mockedGenerateChatResponse).toHaveBeenCalledTimes(1);

        // Wait for the bot's response to appear
        await waitFor(() => {
            expect(screen.getByText('Mocked response')).toBeInTheDocument();
        });

        // Session should be saved
        expect(mockedSaveChatSession).toHaveBeenCalled();
    });

    // Fix: Use it() which is now available.
    it('disables send button when input is empty or loading', () => {
        render(<ChatView />);
        const sendButton = screen.getByLabelText('Send message');
        // Fix: Use expect() which is now available.
        expect(sendButton).toBeDisabled();
    });
    
    // Fix: Use it() which is now available.
    it('shows and hides chat history modal', async () => {
        const mockSessions: ChatSession[] = [{ id: '1', title: 'Test Chat', timestamp: new Date().toISOString(), messages: [] }];
        mockedGetAllChatSessions.mockResolvedValue(mockSessions);
        
        render(<ChatView />);

        // Modal should not be visible
        // Fix: Use expect() which is now available.
        expect(screen.queryByText('Chat History')).not.toBeInTheDocument();
        
        // Open modal
        const historyButton = screen.getByLabelText('View chat history');
        fireEvent.click(historyButton);

        // Modal should now be visible
        await waitFor(() => {
            expect(screen.getByText('Chat History')).toBeInTheDocument();
        });
        expect(screen.getByText('Test Chat')).toBeInTheDocument();

        // Close modal
        fireEvent.click(screen.getByText('Close'));
        await waitFor(() => {
            expect(screen.queryByText('Chat History')).not.toBeInTheDocument();
        });
    });
});
