
import React, { useState, useMemo, useEffect } from 'react';
import { SearchIcon, DownloadIcon, StarIcon, CloseIcon, MagicIcon } from './icons';
import { generateAiTemplate } from '../usecases/templateLibraryUseCase';

// --- TYPE DEFINITIONS ---
interface Template {
  id: string;
  title: string;
  description: string;
  author: string;
  avatar: string;
  tags: string[];
  downloads: number;
  rating: number;
  category: 'Marketing' | 'HR' | 'Content' | 'Productivity' | 'Finance';
  createdAt: string; // ISO date string
}
type TemplateCategory = Template['category'];

// --- MOCK DATA ---
const initialTemplatesData: Template[] = [
  { id: 't6', title: 'Social Media Content Calendar', description: 'Plan and schedule your social media posts across multiple platforms with this easy-to-use calendar.', author: 'Socially Savvy', avatar: 'https://i.pravatar.cc/150?u=social', tags: ['Social Media', 'Marketing'], downloads: 3100, rating: 4.8, category: 'Marketing', createdAt: '2023-11-08T12:00:00Z'},
  { id: 't8', title: 'Startup Pitch Deck Template', description: 'Impress investors with this professionally designed pitch deck template covering all key areas.', author: 'VC Ready', avatar: 'https://i.pravatar.cc/150?u=vc', tags: ['Startup', 'Finance'], downloads: 4200, rating: 4.9, category: 'Finance', createdAt: '2023-11-10T15:00:00Z'},
  { id: 't3', title: 'SEO Content Strategy Workflow', description: 'A complete workflow for researching, creating, and publishing SEO-optimized content.', author: 'Content Masters', avatar: 'https://i.pravatar.cc/150?u=content', tags: ['SEO', 'Content'], downloads: 2500, rating: 4.7, category: 'Content', createdAt: '2023-11-01T09:00:00Z'},
];

const TEMPLATES_PER_PAGE = 6;

// --- CHILD COMPONENTS ---
const GenerateTemplateModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAddTemplate: (template: Template) => void;
}> = ({ isOpen, onClose, onAddTemplate }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedTemplate, setGeneratedTemplate] = useState('');

    useEffect(() => {
      if(isOpen) {
        setPrompt('');
        setGeneratedTemplate('');
      }
    }, [isOpen])

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setGeneratedTemplate('');
        const result = await generateAiTemplate(prompt);
        setGeneratedTemplate(result);
        setIsLoading(false);
    };

    const handleAddToLibrary = () => {
      if(!generatedTemplate) return;
      const title = generatedTemplate.split('\n')[0].replace('#', '').trim() || prompt;
      const newTemplate: Template = {
        id: `gen_${Date.now()}`,
        title: title,
        description: generatedTemplate, // Storing full markdown as description
        author: 'AI Assistant',
        avatar: 'https://ui-avatars.com/api/?name=AI&background=3B82F6&color=fff',
        tags: ['AI-Generated', prompt.split(' ')[0]],
        downloads: 0,
        rating: 5.0,
        category: 'Productivity',
        createdAt: new Date().toISOString(),
      };
      onAddTemplate(newTemplate);
      onClose();
    }

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-brand-medium rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50 dark:bg-white/5">
                  <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generate Custom Template</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Describe the template you need, and the AI will create it for you.</p>
                  </div>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><CloseIcon /></button>
                </div>
                <div className="p-6 flex-shrink-0 bg-white dark:bg-brand-medium">
                    <div className="flex gap-3">
                        <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g., 'A press release for a new product launch'" className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
                        <button onClick={handleGenerate} disabled={isLoading || !prompt} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-xl flex-shrink-0 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all">
                            {isLoading ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </div>
                {(isLoading || generatedTemplate) && (
                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-brand-dark/30 border-t border-gray-100 dark:border-gray-700">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p>Crafting your template...</p>
                        </div>
                    )}
                    {generatedTemplate && (
                      <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: generatedTemplate.replace(/\n/g, '<br/>') }} />
                    )}
                  </div>
                )}
                {generatedTemplate && (
                  <div className="p-4 bg-white dark:bg-brand-medium border-t border-gray-100 dark:border-gray-700 rounded-b-xl flex justify-end">
                    <button onClick={handleAddToLibrary} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-xl shadow-lg shadow-green-500/20 transition-all">Add to Library</button>
                  </div>
                )}
            </div>
        </div>
    );
};


const TemplateCard: React.FC<{ template: Template }> = ({ template }) => {
    const { title, description, author, avatar, tags, downloads, rating } = template;
    const [copied, setCopied] = useState(false);

    const handleImport = () => {
        navigator.clipboard.writeText(description);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formattedDownloads = new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(downloads);

    return (
        <div className="bg-white dark:bg-brand-medium p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group">
            <div>
                <div className="flex justify-between items-start mb-3">
                     <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate pr-2 leading-tight" title={title}>{title}</h3>
                     <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg border border-yellow-100 dark:border-yellow-800/30">
                        <StarIcon className="w-3.5 h-3.5 text-yellow-500 mr-1" filled/>
                        <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">{rating.toFixed(1)}</span>
                     </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 h-10 line-clamp-2 leading-relaxed">{description}</p>
                
                <div className="flex flex-wrap gap-2 mb-5">
                    {tags.slice(0, 3).map(tag => (
                        <span key={tag} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">{tag}</span>
                    ))}
                </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src={avatar} alt={author} className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{author}</span>
                </div>
                <div className="flex items-center gap-3">
                     <span className="flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500"><DownloadIcon className="w-3 h-3" /> {formattedDownloads}</span>
                    <button onClick={handleImport} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 font-semibold py-1.5 px-3 rounded-lg transition-colors text-xs">
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TemplateLibraryView: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>(initialTemplatesData);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ category: 'All', sortBy: 'popular' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const categories = ['All', ...Array.from(new Set(initialTemplatesData.map(t => t.category)))];

    const filteredAndSortedTemplates = useMemo(() => {
        let processed = [...templates];
        if (searchTerm) {
            processed = processed.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (filters.category !== 'All') {
            processed = processed.filter(t => t.category === filters.category);
        }
        switch (filters.sortBy) {
            case 'rating': processed.sort((a, b) => b.rating - a.rating); break;
            case 'newest': processed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
            default: processed.sort((a, b) => b.downloads - a.downloads); break;
        }
        return processed;
    }, [searchTerm, filters, templates]);

    useEffect(() => { setCurrentPage(1); }, [filteredAndSortedTemplates.length]);

    const totalPages = Math.ceil(filteredAndSortedTemplates.length / TEMPLATES_PER_PAGE);
    const paginatedTemplates = filteredAndSortedTemplates.slice((currentPage - 1) * TEMPLATES_PER_PAGE, currentPage * TEMPLATES_PER_PAGE);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleAddTemplate = (newTemplate: Template) => {
        setTemplates(prev => [newTemplate, ...prev]);
    };

    return (
        <>
            <GenerateTemplateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTemplate={handleAddTemplate} />
            <div className="flex flex-col h-full bg-gray-50 dark:bg-brand-dark overflow-y-auto">
                <header className="h-20 flex-shrink-0 flex items-center justify-between px-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-brand-medium">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Template Library</h1>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5">
                        <MagicIcon className="w-5 h-5"/>
                        <span className="hidden sm:inline">AI Generate</span>
                    </button>
                </header>

                <div className="p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col">
                    <div className="bg-white dark:bg-brand-medium p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="relative md:col-span-6 lg:col-span-8">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search for templates..." className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 pl-12 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
                        </div>
                        <div className="md:col-span-3 lg:col-span-2">
                             <select name="category" value={filters.category} onChange={handleFilterChange} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {categories.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-3 lg:col-span-2">
                             <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="popular">Most Popular</option>
                                <option value="newest">Newest Added</option>
                                <option value="rating">Highest Rated</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-1">
                        {paginatedTemplates.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedTemplates.map((template) => <TemplateCard key={template.id} template={template} />)}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-brand-medium rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                                 <SearchIcon className="w-12 h-12 mb-4 opacity-20"/>
                                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Templates Found</h3>
                                 <p>Try adjusting your search or filters to find what you're looking for.</p>
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <footer className="flex justify-center items-center mt-10 pb-4">
                            <nav className="flex items-center gap-2 text-sm font-medium bg-white dark:bg-brand-medium p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors">&lt;</button>
                                {[...Array(totalPages)].map((_, i) => (
                                   <button key={i} onClick={() => setCurrentPage(i + 1)} className={`p-2 w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>{i + 1}</button>
                                ))}
                                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors">&gt;</button>
                            </nav>
                        </footer>
                    )}
                </div>
            </div>
        </>
    );
};

export default TemplateLibraryView;
