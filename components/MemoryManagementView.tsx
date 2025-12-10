
import React, { useState, useEffect, useMemo } from 'react';
import { SearchIcon, TrashIcon, EditIcon, AddIcon, CloseIcon } from './icons';
import { memoryManager } from '../memory/memoryManager';
import { Memory } from '../types';

// --- TYPE DEFINITIONS ---
type MemoryTypeFilter = Memory['type'] | 'All Memories';
type MemoryTypeOption = Memory['type'];

// --- CONSTANTS ---
const MEMORIES_PER_PAGE = 8;
const MEMORY_TYPE_FILTERS: MemoryTypeFilter[] = ['All Memories', 'Goals', 'Preferences', 'Context', 'Decisions', 'History'];
const MEMORY_TYPE_OPTIONS: MemoryTypeOption[] = ['Goals', 'Preferences', 'Context', 'Decisions', 'History'];

// --- HELPER FUNCTIONS ---
const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

// --- CHILD COMPONENTS ---
const MemoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string | undefined, content: string, type: MemoryTypeOption) => Promise<void>;
    memory: Memory | null;
}> = ({ isOpen, onClose, onSave, memory }) => {
    const [content, setContent] = useState('');
    const [type, setType] = useState<MemoryTypeOption>('Context');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (memory) {
            setContent(memory.content);
            setType(memory.type);
        } else {
            setContent('');
            setType('Context');
        }
    }, [memory, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSaving) return;
        setIsSaving(true);
        await onSave(memory?.id, content, type);
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-brand-medium rounded-2xl shadow-2xl w-full max-w-lg p-8 border border-gray-200 dark:border-gray-700 transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{memory ? 'Edit Memory' : 'New Memory'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="memory-content" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Content</label>
                            <textarea
                                id="memory-content"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                rows={4}
                                required
                                placeholder="What should the AI remember?"
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                            />
                        </div>
                        <div>
                            <label htmlFor="memory-type" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                            <select
                                id="memory-type"
                                value={type}
                                onChange={e => setType(e.target.value as MemoryTypeOption)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            >
                                {MEMORY_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-white dark:bg-brand-light border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-2.5 px-5 rounded-xl transition-colors">Cancel</button>
                        <button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">{isSaving ? 'Saving...' : (memory ? 'Save Changes' : 'Add Memory')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const MemoryManagementView: React.FC = () => {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<MemoryTypeFilter>('All Memories');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshMemories = async () => {
        setIsLoading(true);
        const allMemories = await memoryManager.getAllMemories();
        setMemories(allMemories);
        setIsLoading(false);
    };

    useEffect(() => {
        refreshMemories();
    }, []);

    const filteredMemories = useMemo(() => {
        return memories
            .filter(mem => activeFilter === 'All Memories' || mem.type === activeFilter)
            .filter(mem => mem.content.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [memories, searchTerm, activeFilter]);

    const sortedMemories = useMemo(() => {
        return [...filteredMemories].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [filteredMemories]);
    
    const totalPages = Math.ceil(sortedMemories.length / MEMORIES_PER_PAGE);
    const paginatedMemories = sortedMemories.slice((currentPage - 1) * MEMORIES_PER_PAGE, currentPage * MEMORIES_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter, searchTerm]);

    const handleSaveMemory = async (id: string | undefined, content: string, type: MemoryTypeOption) => {
        if (id) {
            await memoryManager.updateMemory(id, content, type);
        } else {
            await memoryManager.addMemory({ content, type });
        }
        await refreshMemories();
        setIsModalOpen(false);
        setEditingMemory(null);
    };

    const handleDeleteMemory = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this memory?')) {
            await memoryManager.deleteMemory(id);
            await refreshMemories();
        }
    };
    
    const handlePurge = async () => {
        if (window.confirm('Are you sure you want to delete ALL memories? This action cannot be undone.')) {
            await memoryManager.purgeAll();
            await refreshMemories();
        }
    };

    const handleExport = async () => {
        const dataToExport = await memoryManager.getAllMemories();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "memories_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <>
            <MemoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveMemory} memory={editingMemory} />
            <div className="flex h-full bg-gray-50 dark:bg-brand-dark text-gray-900 dark:text-gray-100 overflow-hidden">
                <div className="w-64 bg-white dark:bg-brand-medium border-r border-gray-200 dark:border-gray-800 flex flex-col p-6 flex-shrink-0 z-20">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6 pl-3">Memory Bank</h3>
                    <nav className="space-y-2">
                        {MEMORY_TYPE_FILTERS.map(type => (
                            <button key={type} onClick={() => setActiveFilter(type)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeFilter === type ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900'}`}>
                                {type}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <header className="h-20 flex justify-between items-center px-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-brand-medium">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
                        <button onClick={() => { setEditingMemory(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5">
                            <AddIcon className="w-4 h-4"/> <span>Add Memory</span>
                        </button>
                    </header>

                    <main className="flex-1 p-8 overflow-hidden flex flex-col bg-gray-50 dark:bg-brand-dark">
                        <div className="flex gap-4 mb-6">
                            <div className="relative flex-1">
                                 <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                 <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search memories..." className="w-full bg-white dark:bg-brand-medium border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 pl-12 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow shadow-sm"/>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleExport} className="bg-white dark:bg-brand-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white font-medium py-2 px-5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">Export JSON</button>
                                <button onClick={handlePurge} className="bg-white dark:bg-brand-medium border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-medium py-2 px-5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm">Purge</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden bg-white dark:bg-brand-medium rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                            <div className="overflow-y-auto flex-1">
                                <table className="w-full text-sm text-left">
                                    <thead className="sticky top-0 bg-gray-50/95 dark:bg-brand-medium/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold z-10">
                                        <tr>
                                            <th className="p-5 w-3/5 pl-8">Content</th>
                                            <th className="p-5">Type</th>
                                            <th className="p-5">Created</th>
                                            <th className="p-5 text-right pr-8">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {isLoading ? (
                                            <tr><td colSpan={4} className="text-center p-12 text-gray-500">Loading memories...</td></tr>
                                        ) : paginatedMemories.length > 0 ? paginatedMemories.map(mem => (
                                            <tr key={mem.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors group">
                                                <td className="p-5 pl-8 max-w-lg truncate font-medium text-gray-900 dark:text-gray-200">{mem.content}</td>
                                                <td className="p-5">
                                                    <span className={`px-3 py-1 text-xs rounded-full font-bold uppercase tracking-wide border ${
                                                        mem.type === 'Preferences' ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-900/30' :
                                                        mem.type === 'Goals' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/30' :
                                                        mem.type === 'Decisions' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-900/30' :
                                                        'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                                                    }`}>{mem.type}</span>
                                                </td>
                                                <td className="p-5 text-gray-500 dark:text-gray-400">{formatDate(mem.createdAt)}</td>
                                                <td className="p-5 text-right pr-8">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => { setEditingMemory(mem); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"><EditIcon className="w-4 h-4"/></button>
                                                        <button onClick={() => handleDeleteMemory(mem.id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><TrashIcon className="w-4 h-4"/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="text-center p-20 text-gray-400 dark:text-gray-500">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <SearchIcon className="w-8 h-8 opacity-20" />
                                                        <p>No memories found matching your criteria.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {totalPages > 1 && (
                            <footer className="flex justify-between items-center mt-6 text-sm text-gray-500 dark:text-gray-400 px-2">
                                <p>Showing {Math.min((currentPage - 1) * MEMORIES_PER_PAGE + 1, sortedMemories.length)} to {Math.min(currentPage * MEMORIES_PER_PAGE, sortedMemories.length)} of {sortedMemories.length} results</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-brand-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors font-medium">Previous</button>
                                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-brand-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors font-medium">Next</button>
                                </div>
                            </footer>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
};

export default MemoryManagementView;
