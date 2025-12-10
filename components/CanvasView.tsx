
import React, { useState, useEffect } from 'react';
import { CanvasItem } from '../types';
import {
  ProblemIcon, SolutionIcon, KeyMetricsIcon, UvpIcon,
  UnfairAdvantageIcon, ChannelsIcon, CustomerSegmentsIcon,
  CostStructureIcon, RevenueStreamsIcon, MagicIcon, DownloadIcon, EditIcon
} from './icons';
import { getAiCanvasSuggestions, saveCanvasData, loadCanvasData } from '../usecases/canvasUseCase';

const initialCanvasItems: CanvasItem[] = [
  { id: 'problem', title: 'Problem', icon: ProblemIcon, content: '' },
  { id: 'solution', title: 'Solution', icon: SolutionIcon, content: '' },
  { id: 'key-metrics', title: 'Key Metrics', icon: KeyMetricsIcon, content: '' },
  { id: 'uvp', title: 'Unique Value Proposition', icon: UvpIcon, content: '' },
  { id: 'unfair-advantage', title: 'Unfair Advantage', icon: UnfairAdvantageIcon, content: '' },
  { id: 'channels', title: 'Channels', icon: ChannelsIcon, content: '' },
  { id: 'customer-segments', title: 'Customer Segments', icon: CustomerSegmentsIcon, content: '' },
  { id: 'cost-structure', title: 'Cost Structure', icon: CostStructureIcon, content: '' },
  { id: 'revenue-streams', title: 'Revenue Streams', icon: RevenueStreamsIcon, content: '' },
];

const CanvasCard: React.FC<{ item: CanvasItem; onEdit: (id: string, content: string) => void }> = ({ item, onEdit }) => {
  return (
    <div className="bg-white dark:bg-brand-medium rounded-2xl p-5 flex flex-col border border-gray-200 dark:border-gray-700/60 shadow-sm hover:shadow-lg transition-all duration-200 h-full group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-500 transition-colors duration-300"></div>
      <div className="flex items-center mb-4 pl-3">
        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
             <item.icon className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wider ml-3">{item.title}</h3>
      </div>
      <textarea
        value={item.content}
        onChange={(e) => onEdit(item.id, e.target.value)}
        placeholder={`Describe the ${item.title.toLowerCase()}...`}
        className="flex-1 bg-transparent text-sm leading-relaxed text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 resize-none focus:outline-none w-full min-h-[140px] pl-3"
      />
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <EditIcon className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
};

const CanvasView: React.FC = () => {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>(initialCanvasItems);
  const [projectName, setProjectName] = useState<string>('Project Phoenix');
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        const savedData = await loadCanvasData();
        if (savedData) {
            setProjectName(savedData.name);
            const hydratedItems = initialCanvasItems.map(initialItem => {
                const savedItem = savedData.items.find(s => s.id === initialItem.id);
                return { ...initialItem, content: savedItem?.content || '' };
            });
            setCanvasItems(hydratedItems);
        }
        setIsDataLoaded(true);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    const itemsToSave = canvasItems.map(({ id, title, content }) => ({ id, title, content }));
    saveCanvasData(projectName, itemsToSave);
  }, [projectName, canvasItems, isDataLoaded]);

  const handleEditItem = (id: string, content: string) => {
    setCanvasItems(items => items.map(item => item.id === id ? { ...item, content } : item));
  };

  const handleAiAssist = async () => {
      setIsLoading(true);
      setAiSuggestion('');
      const suggestions = await getAiCanvasSuggestions(
          projectName, 
          canvasItems.map(i => ({title: i.title, content: i.content}))
      );
      setAiSuggestion(suggestions);
      setIsLoading(false);
  };

  const handleExport = () => {
    let markdownContent = `# ${projectName}\n\n`;
    canvasItems.forEach(item => {
        markdownContent += `## ${item.title}\n`;
        markdownContent += `${item.content || 'N/A'}\n\n`;
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-canvas.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-brand-dark overflow-y-auto">
      {/* Header */}
      <header className="h-20 flex-shrink-0 flex items-center justify-between px-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-brand-medium sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col">
             <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Project Name</label>
             <input 
                type="text" 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-xl font-bold bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-md px-1 -ml-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            />
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handleAiAssist}
                disabled={isLoading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
            >
                <MagicIcon className="w-5 h-5"/>
                <span>{isLoading ? 'Analyzing...' : 'AI Critique'}</span>
            </button>
             <button onClick={handleExport} className="flex items-center gap-2 bg-white dark:bg-brand-light border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium py-2.5 px-5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                <DownloadIcon className="w-5 h-5" />
                <span>Export</span>
            </button>
        </div>
      </header>
      
      <main className="flex-1 p-8">
        {aiSuggestion && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-6 rounded-2xl mb-8 border border-blue-100 dark:border-blue-800/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h3 className="font-bold text-lg mb-3 text-blue-900 dark:text-blue-300 flex items-center gap-2">
                    <MagicIcon className="w-5 h-5" /> Strategic Suggestions
                </h3>
                <div className="prose prose-sm prose-blue max-w-none text-blue-800 dark:text-blue-100/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiSuggestion.replace(/\n/g, '<br />') }}></div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 pb-8">
          <div className="lg:col-span-2 xl:col-span-1 min-h-[220px]"><CanvasCard item={canvasItems[0]} onEdit={handleEditItem} /></div>
          <div className="lg:col-span-2 xl:col-span-1 min-h-[220px]"><CanvasCard item={canvasItems[1]} onEdit={handleEditItem} /></div>
          <div className="lg:col-span-2 xl:col-span-1 min-h-[220px]"><CanvasCard item={canvasItems[2]} onEdit={handleEditItem} /></div>
          <div className="lg:col-span-2 xl:col-span-1 min-h-[220px]"><CanvasCard item={canvasItems[3]} onEdit={handleEditItem} /></div>
          <div className="xl:col-span-1 min-h-[220px]"><CanvasCard item={canvasItems[4]} onEdit={handleEditItem} /></div>
          
          <div className="xl:col-span-1 min-h-[220px]"><CanvasCard item={canvasItems[5]} onEdit={handleEditItem} /></div>
          <div className="lg:col-span-2 xl:col-span-1 min-h-[220px]"><CanvasCard item={canvasItems[6]} onEdit={handleEditItem} /></div>
          <div className="lg:col-span-2 xl:col-span-1 min-h-[220px]"><CanvasCard item={canvasItems[7]} onEdit={handleEditItem} /></div>
          <div className="lg:col-span-2 xl:col-span-1 min-h-[220px]"><CanvasCard item={canvasItems[8]} onEdit={handleEditItem} /></div>
        </div>
      </main>
    </div>
  );
};

export default CanvasView;
