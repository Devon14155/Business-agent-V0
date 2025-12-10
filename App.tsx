import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import CanvasView from './components/CanvasView';
import CompetitiveScannerView from './components/CompetitiveScannerView';
import FinancialProjectionsView from './components/FinancialProjectionsView';
import TemplateLibraryView from './components/TemplateLibraryView';
import MemoryManagementView from './components/MemoryManagementView';
import SettingsView from './components/SettingsView';
import ImageGeneratorView from './components/ImageGeneratorView';
import { View } from './types';
import { storageService } from './storage/storageService';
import { observabilityService } from './services/observabilityService';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('chat');
  const [theme, setTheme] = useState<Theme>('light');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      observabilityService.init();
      await storageService.initialize();
      const savedTheme = await storageService.getTheme();
      setTheme(savedTheme);
      setIsInitializing(false);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (isInitializing) return;
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    storageService.setTheme(theme);
  }, [theme, isInitializing]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };
  
  const renderView = () => {
    switch (currentView) {
      case 'chat':
        return <ChatView />;
      case 'canvas':
        return <CanvasView />;
      case 'competitor-scanner':
        return <CompetitiveScannerView />;
      case 'image-generator':
        return <ImageGeneratorView />;
      case 'financial-projections':
        return <FinancialProjectionsView />;
      case 'template-library':
        return <TemplateLibraryView />;
      case 'memory-management':
        return <MemoryManagementView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <ChatView />;
    }
  };

  if (isInitializing) {
    return <div className="h-screen w-screen flex items-center justify-center bg-lm-bg dark:bg-brand-dark"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div></div>;
  }

  return (
    <div className="h-screen w-screen flex bg-lm-bg dark:bg-brand-dark overflow-hidden transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <div className="flex-1 h-full">
        {renderView()}
      </div>
    </div>
  );
};

export default App;
