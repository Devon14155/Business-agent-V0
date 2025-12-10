
import React from 'react';
import { View } from '../types';
import { 
  ChatIcon, CanvasIcon, SearchIcon, FinancialProjectionsIcon, 
  TemplateLibraryIcon, MemoryManagementIcon, ImageIcon,
  SunIcon, MoonIcon, SettingsIcon 
} from './icons';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, theme, toggleTheme }) => {
  const navItems = [
    { id: 'chat', icon: ChatIcon, label: 'Chat Assistant' },
    { id: 'canvas', icon: CanvasIcon, label: 'Lean Canvas' },
    { id: 'financial-projections', icon: FinancialProjectionsIcon, label: 'Financial Model' },
    { id: 'competitor-scanner', icon: SearchIcon, label: 'Market Scanner' },
    { id: 'image-generator', icon: ImageIcon, label: 'Image Studio' },
    { id: 'template-library', icon: TemplateLibraryIcon, label: 'Templates' },
    { id: 'memory-management', icon: MemoryManagementIcon, label: 'Memory Bank' },
  ] as const;

  return (
    <aside className="w-20 lg:w-72 bg-white dark:bg-brand-medium flex flex-col flex-shrink-0 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-50">
      {/* Header */}
      <div className="h-20 flex items-center justify-center lg:justify-start px-0 lg:px-6 border-b border-gray-100 dark:border-gray-800/50">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transform hover:scale-105 transition-transform duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436h.001c-3.7 2.881-8.2 5.264-13.255 5.264a.75.75 0 01-.75-.75c0-5.055 2.383-9.555 6.084-12.436z" clipRule="evenodd" />
                    <path d="M4.786 2.812a.75.75 0 01-.449.664c-2.975 1.058-4.145 4.326-2.608 7.311.53.18 1.08.318 1.643.406a11.233 11.233 0 011.667-2.986c.654-.836 1.4-1.587 2.215-2.253A11.08 11.08 0 004.786 2.812z" />
                </svg>
            </div>
            <div className="hidden lg:block">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-none">Pocket Expert</h1>
                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Business AI</p>
            </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-thin">
        <div className="px-3 mb-2 hidden lg:block">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tools</p>
        </div>
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center p-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full lg:hidden" />
              )}
              <item.icon className={`h-6 w-6 lg:h-5 lg:w-5 flex-shrink-0 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
              <span className="hidden lg:inline ml-3 truncate">{item.label}</span>
              
              {/* Tooltip for mobile/collapsed state could go here, but omitted for simplicity */}
            </button>
          );
        })}
      </nav>

      {/* Footer / Settings */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2 bg-gray-50/50 dark:bg-black/20">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center lg:justify-start p-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm hover:shadow"
        >
          {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          <span className="hidden lg:inline ml-3">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
        <button
          onClick={() => setView('settings')}
          className={`w-full flex items-center justify-center lg:justify-start p-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow ${
              currentView === 'settings'
                ? 'bg-blue-600 text-white shadow-blue-500/30'
                : 'bg-white dark:bg-brand-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
          <SettingsIcon className="h-5 w-5" />
          <span className="hidden lg:inline ml-3">Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
