
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatSession } from '../types';
import { generateChatResponse, ChatOptions } from '../usecases/chatUseCase';
import { storageService } from '../storage/storageService';
import { observabilityService } from '../services/observabilityService';
import { SendIcon, PaperclipIcon, MicrophoneIcon, XCircleIcon, WrenchScrewdriverIcon, CheckIcon, AddIcon, HistoryIcon, TrashIcon, CopyIcon } from './icons';

// --- SPEECH RECOGNITION SETUP ---
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
}

const initialMessage: ChatMessage = { 
  sender: 'bot', 
  text: "Hello! I'm your AI business partner. How can I help you accelerate your work today?" 
};

// --- CHILD COMPONENTS ---
const ChatHistoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    sessions: ChatSession[];
    onLoad: (session: ChatSession) => void;
    onDelete: (sessionId: string) => void;
}> = ({ isOpen, onClose, sessions, onLoad, onDelete }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-brand-medium rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chat History</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-2">
                    {sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                             <HistoryIcon className="w-10 h-10 mb-2 opacity-50"/>
                             <p>No saved chats found.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {sessions.map(session => (
                                <div key={session.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer" onClick={() => onLoad(session)}>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm">{session.title}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{new Date(session.timestamp).toLocaleDateString()} &middot; {new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDelete(session.id); }} 
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete chat"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [activeTools, setActiveTools] = useState<ChatOptions>({
    deepThinking: false,
    researchMode: false,
  });
  
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!recognition) return;
    recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) setInput(prev => prev + ' ' + finalTranscript);
    };
    recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    return () => { if(recognition) recognition.stop() };
  }, []);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const saveCurrentSession = async () => {
      if (currentSessionId && messages.length > 1) { // More than initial message
          const session = await storageService.getChatSession(currentSessionId);
          const title = session?.title || messages[1]?.text.substring(0, 40) || "Chat";
          const sessionToSave: ChatSession = {
              id: currentSessionId,
              title,
              timestamp: new Date().toISOString(),
              messages,
          };
          await storageService.saveChatSession(sessionToSave);
      }
  };

  const handleToggleRecording = () => {
    if (!recognition) return alert("Sorry, your browser doesn't support voice recognition.");
    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
    }
    setIsRecording(!isRecording);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setAttachment(file);
        if (file.type.startsWith('image/')) {
            setAttachmentPreview(URL.createObjectURL(file));
        } else {
            setAttachmentPreview(null);
        }
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if(attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachmentPreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleToggleTool = (tool: keyof ChatOptions) => {
      setActiveTools(prev => ({ ...prev, [tool]: !prev[tool] }));
  };

  const handleNewChat = async () => {
    if (isLoading) return;
    await saveCurrentSession();
    setCurrentSessionId(null);
    setMessages([initialMessage]);
    setInput('');
    handleRemoveAttachment();
    setActiveTools({ deepThinking: false, researchMode: false });
    if (isRecording) {
        recognition?.stop();
        setIsRecording(false);
    }
    observabilityService.logInfo('New chat started');
  };

  const handleSend = async () => {
    if ((input.trim() === '' && !attachment) || isLoading) return;

    observabilityService.startPerformanceMeasure('chat-response-time');
    const userMessage: ChatMessage = { sender: 'user', text: input.trim() };
    if (attachment) {
      userMessage.attachment = { name: attachment.name, type: attachment.type, previewUrl: attachmentPreview || undefined, file: attachment };
    }
    
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    if(textareaRef.current) textareaRef.current.style.height = 'auto';
    handleRemoveAttachment();
    setIsLoading(true);

    const toolsToUse = { ...activeTools };
    setActiveTools({ deepThinking: false, researchMode: false });
    setIsToolsMenuOpen(false);

    try {
        const history = [...messages];
        const response = await generateChatResponse(history, userMessage, toolsToUse);
        
        const messagesWithFunctionCall = [...currentMessages, response.message];
        let finalMessages = messagesWithFunctionCall;

        if(response.message.functionCall && response.message.functionResponse) {
             const finalResponse = await generateChatResponse(messagesWithFunctionCall, {sender: 'user', text: ''}, toolsToUse);
             finalMessages = [...messagesWithFunctionCall, finalResponse.message];
        } 
        
        setMessages(finalMessages);

        // --- Session Management ---
        let sessionId = currentSessionId;
        let sessionTitle = '';
        
        if (sessionId) {
            const session = await storageService.getChatSession(sessionId);
            sessionTitle = session?.title || 'Chat';
        } else {
            sessionId = `chat_${Date.now()}`;
            sessionTitle = userMessage.text.trim().substring(0, 40) || 'New Chat';
            setCurrentSessionId(sessionId);
        }
        
        const sessionToSave: ChatSession = {
            id: sessionId,
            title: sessionTitle,
            timestamp: new Date().toISOString(),
            messages: finalMessages,
        };
        await storageService.saveChatSession(sessionToSave);

    } catch (error) {
        console.error("Failed to get chat response:", error);
        if (error instanceof Error) {
            observabilityService.logError(error, { context: 'handleSend' });
        }
        setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, something went wrong. Please check your connection and try again." }]);
    } finally {
        setIsLoading(false);
        observabilityService.endPerformanceMeasure('chat-response-time');
    }
  };

  const handleCopy = (text: string, index: number) => {
      navigator.clipboard.writeText(text).then(() => {
          setCopiedMessageIndex(index);
          setTimeout(() => setCopiedMessageIndex(null), 2000);
      }).catch(err => {
          console.error('Failed to copy text:', err);
      });
  };

  // --- History Modal Handlers ---
  const handleOpenHistory = async () => {
      await saveCurrentSession();
      const sessions = await storageService.getAllChatSessions();
      setChatSessions(sessions);
      setIsHistoryOpen(true);
  };
  
  const handleLoadChat = (session: ChatSession) => {
      setCurrentSessionId(session.id);
      setMessages(session.messages);
      setIsHistoryOpen(false);
  };
  
  const handleDeleteChat = async (sessionId: string) => {
      if (window.confirm('Are you sure you want to delete this chat?')) {
          await storageService.deleteChatSession(sessionId);
          setChatSessions(prev => prev.filter(s => s.id !== sessionId));
          if (currentSessionId === sessionId) {
              handleNewChat();
          }
      }
  };

  const renderAttachment = (msg: ChatMessage) => {
      if (!msg.attachment) return null;
      return (
          <div className="mt-2">
              {msg.attachment.previewUrl ? (
                  <img src={msg.attachment.previewUrl} alt={msg.attachment.name} className="rounded-lg max-w-xs max-h-48 border border-gray-200 dark:border-gray-600 object-cover" />
              ) : (
                  <div className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2 border border-gray-200 dark:border-gray-600">
                      <PaperclipIcon className="w-4 h-4 text-gray-500"/>
                      <span className="font-medium">{msg.attachment.name}</span>
                  </div>
              )}
          </div>
      );
  };
  
  const renderSources = (msg: ChatMessage) => {
    if (!msg.sources || msg.sources.length === 0) return null;
    return (
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
        <h4 className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            <span>Sources</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {msg.sources.map((source, index) => (
            <a 
                key={index} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center max-w-[200px] px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-gray-800 text-xs text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors truncate"
            >
                <span className="truncate">{source.title}</span>
            </a>
          ))}
        </div>
      </div>
    );
  };
  
  const isAnyToolActive = Object.values(activeTools).some(v => v);

  return (
    <>
    <ChatHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={chatSessions}
        onLoad={handleLoadChat}
        onDelete={handleDeleteChat}
    />
    <div className="flex flex-col h-full bg-gray-50 dark:bg-brand-dark relative">
      {/* Header */}
      <header className="h-20 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-brand-medium/80 backdrop-blur-md z-10 sticky top-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Chat Assistant</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Powered by Gemini 2.5</p>
          </div>
          <div className="flex items-center gap-3">
            <button
                onClick={handleNewChat}
                className="flex items-center gap-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold py-2 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                disabled={isLoading}
            >
                <AddIcon className="w-4 h-4" />
                <span className="hidden sm:inline">New Chat</span>
            </button>
            <button
                onClick={handleOpenHistory}
                className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                title="View chat history"
            >
                <HistoryIcon className="w-5 h-5" />
            </button>
          </div>
      </header>
      
      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scroll-smooth">
        {messages.map((msg, index) => (
          !msg.functionResponse && 
          <div key={index} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''} max-w-4xl mx-auto w-full`}>
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-black/5 dark:border-white/10 ${
                msg.sender === 'user' 
                ? 'bg-gray-200 dark:bg-gray-700' 
                : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
            }`}>
                {msg.sender === 'user' ? (
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-500 dark:text-gray-300">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436h.001c-3.7 2.881-8.2 5.264-13.255 5.264a.75.75 0 01-.75-.75c0-5.055 2.383-9.555 6.084-12.436z" clipRule="evenodd" />
                        <path d="M4.786 2.812a.75.75 0 01-.449.664c-2.975 1.058-4.145 4.326-2.608 7.311.53.18 1.08.318 1.643.406a11.233 11.233 0 011.667-2.986c.654-.836 1.4-1.587 2.215-2.253A11.08 11.08 0 004.786 2.812z" />
                    </svg>
                )}
            </div>

            {/* Bubble */}
            <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[75%]`}>
                <div className={`relative px-5 py-4 shadow-sm ${
                    msg.sender === 'user' 
                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' 
                        : 'bg-white dark:bg-brand-medium text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-none'
                }`}>
                  {msg.text && <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                  {renderAttachment(msg)}
                  {renderSources(msg)}
                </div>

                {/* Actions */}
                {msg.sender === 'bot' && msg.text && (
                  <div className="mt-2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(msg.text, index)}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedMessageIndex === index ? (
                            <>
                                <CheckIcon className="w-3.5 h-3.5 text-green-500" />
                                <span className="text-green-600">Copied</span>
                            </>
                         ) : (
                            <>
                                <CopyIcon className="w-3.5 h-3.5" />
                                <span>Copy</span>
                            </>
                         )}
                      </button>
                  </div>
                )}
            </div>
          </div>
        ))}

        {isLoading && (
            <div className="flex items-start gap-4 max-w-4xl mx-auto w-full">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm text-white">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 animate-pulse">
                        <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436h.001c-3.7 2.881-8.2 5.264-13.255 5.264a.75.75 0 01-.75-.75c0-5.055 2.383-9.555 6.084-12.436z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="bg-white dark:bg-brand-medium px-6 py-5 rounded-2xl rounded-tl-none shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </main>
      
      {/* Input Area */}
      <footer className="p-4 md:p-6 z-20">
        <div className="max-w-4xl mx-auto">
             {/* Preview Attachment */}
             {attachment && (
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2.5 rounded-xl mb-3 border border-gray-200 dark:border-gray-700 w-fit shadow-md animate-slide-up">
                    <div className="relative">
                         {attachmentPreview ? (
                             <img src={attachmentPreview} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                         ) : (
                             <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                 <PaperclipIcon className="w-5 h-5 text-gray-500"/>
                             </div>
                         )}
                         <button onClick={handleRemoveAttachment} className="absolute -top-2 -right-2 bg-white dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-full p-0.5 border border-gray-200 dark:border-gray-600 shadow-sm">
                            <XCircleIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="pr-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate block max-w-[200px]">{attachment.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{(attachment.size / 1024).toFixed(1)} KB</span>
                    </div>
                </div>
            )}

            {/* Input Container */}
            <div className="relative bg-white dark:bg-brand-medium rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                
                <div className="flex items-end p-2 gap-2">
                    {/* Tools Button */}
                    <div className="relative" ref={toolsMenuRef}>
                        <button 
                            onClick={() => setIsToolsMenuOpen(prev => !prev)} 
                            className={`p-2.5 rounded-xl transition-all ${isAnyToolActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300'}`} 
                            title="AI Tools"
                        >
                            <WrenchScrewdriverIcon className="w-5 h-5" />
                        </button>
                        {isToolsMenuOpen && (
                            <div className="absolute bottom-full left-0 mb-3 w-64 bg-white dark:bg-brand-medium rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 animate-fade-in">
                                <div className="text-xs font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider mb-1">Response Mode</div>
                                <button onClick={() => handleToggleTool('deepThinking')} className="w-full flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors">
                                    <div className="flex flex-col text-left">
                                        <span>Deep Thinking</span>
                                        <span className="text-[10px] text-gray-400 font-normal">Complex reasoning (Pro Model)</span>
                                    </div>
                                    {activeTools.deepThinking && <CheckIcon className="w-4 h-4 text-blue-600" />}
                                </button>
                                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                                <button onClick={() => handleToggleTool('researchMode')} className="w-full flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors">
                                    <div className="flex flex-col text-left">
                                        <span>Research Mode</span>
                                        <span className="text-[10px] text-gray-400 font-normal">Web grounded answers</span>
                                    </div>
                                    {activeTools.researchMode && <CheckIcon className="w-4 h-4 text-blue-600" />}
                                </button>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                        title="Attach file"
                    >
                        <PaperclipIcon className="w-5 h-5" />
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Ask anything..."
                        className="flex-1 bg-transparent border-0 focus:ring-0 resize-none py-3 px-1 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 max-h-[150px] min-h-[44px]"
                        rows={1}
                        disabled={isLoading}
                    />
                    
                    <button 
                        onClick={handleToggleRecording} 
                        className={`p-2.5 rounded-xl transition-all ${isRecording ? 'bg-red-100 text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`} 
                        title="Voice Input"
                    >
                        <MicrophoneIcon className="w-5 h-5" />
                    </button>
                    
                    <button 
                        onClick={handleSend} 
                        disabled={isLoading || (input.trim() === '' && !attachment)} 
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all transform active:scale-95"
                        title="Send Message"
                    >
                        <SendIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
            <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-3 font-medium">AI can make mistakes. Verify critical information.</p>
        </div>
      </footer>
    </div>
    </>
  );
};

export default ChatView;
