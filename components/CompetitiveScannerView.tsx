
import React, { useState } from 'react';
import { performCompetitiveAnalysis } from '../usecases/competitiveAnalysisUseCase';
import { SearchIcon } from './icons';
import { GroundingSource, CompetitiveAnalysisResult } from '../types';

const CompetitiveScannerView: React.FC = () => {
    const [query, setQuery] = useState<string>('the electric vehicle market in North America');
    const [result, setResult] = useState<CompetitiveAnalysisResult | null>(null);
    const [sources, setSources] = useState<GroundingSource[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleAnalysis = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setResult(null);
        setSources([]);
        setError('');
        try {
            const { result: analysisResult, sources: analysisSources } = await performCompetitiveAnalysis(query);
            if (analysisResult) {
                setResult(analysisResult);
                setSources(analysisSources);
            } else {
                setError('Failed to get a structured analysis. The model may have provided an invalid response. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred while performing the analysis.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-brand-dark overflow-y-auto">
            <header className="h-20 flex-shrink-0 flex items-center justify-between px-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-brand-medium">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Competitor Scanner</h2>
            </header>
            <main className="flex-1 p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Search Section */}
                    <div className="bg-white dark:bg-brand-medium p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-10 text-center">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Identify Market Opportunities</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Analyze key players, trends, and gaps in any industry instantly.</p>
                        
                        <div className="flex gap-4 max-w-2xl mx-auto">
                            <div className="relative flex-1 group">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAnalysis()}
                                    placeholder="e.g., 'SaaS payroll software for small business'"
                                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 pl-12 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                                    disabled={isLoading}
                                />
                            </div>
                            <button 
                                onClick={handleAnalysis} 
                                disabled={isLoading} 
                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Scanning...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Analyze</span>
                                    </>
                                )}
                            </button>
                        </div>
                        {error && <div className="mt-4 text-red-500 bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-lg inline-block text-sm font-medium">{error}</div>}
                    </div>

                    {result && (
                        <div className="space-y-10 animate-fade-in pb-10">
                            {/* Key Players */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                                    <h3 className="font-bold text-2xl text-gray-900 dark:text-white">Key Players</h3>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {result.keyPlayers.map(player => (
                                        <div key={player.name} className="bg-white dark:bg-brand-medium p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
                                            <div className="mb-4">
                                                <h4 className="font-bold text-xl text-gray-900 dark:text-white mb-1">{player.name}</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{player.description}</p>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="bg-green-50/50 dark:bg-green-900/5 p-3 rounded-lg border border-green-100 dark:border-green-900/20">
                                                    <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider block mb-1">Strengths</span> 
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">{player.strengths.join(', ')}</p>
                                                </div>
                                                <div className="bg-red-50/50 dark:bg-red-900/5 p-3 rounded-lg border border-red-100 dark:border-red-900/20">
                                                    <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block mb-1">Weaknesses</span> 
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">{player.weaknesses.join(', ')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
                                        <h3 className="font-bold text-2xl text-gray-900 dark:text-white">Market Trends</h3>
                                    </div>
                                    <div className="bg-white dark:bg-brand-medium p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm h-full">
                                        <ul className="space-y-4">
                                            {result.marketTrends.map((trend, i) => (
                                                <li key={i} className="flex items-start gap-4 text-gray-700 dark:text-gray-300 group">
                                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-100 dark:border-indigo-800">{i + 1}</span>
                                                    <span className="mt-1 font-medium">{trend}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </section>

                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
                                        <h3 className="font-bold text-2xl text-gray-900 dark:text-white">Opportunities</h3>
                                    </div>
                                    <div className="bg-white dark:bg-brand-medium p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm h-full">
                                        <ul className="space-y-4">
                                            {result.potentialOpportunities.map((opp, i) => (
                                                <li key={i} className="flex items-start gap-4 text-gray-700 dark:text-gray-300">
                                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-100 dark:border-emerald-800">{i + 1}</span>
                                                    <span className="mt-1 font-medium">{opp}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </section>
                            </div>

                            {sources.length > 0 && (
                                <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                                    <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Cited Sources</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {sources.map((source, index) => (
                                            <a key={index} href={source.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-white dark:bg-brand-medium px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all">
                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                <span className="truncate max-w-xs">{source.title}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CompetitiveScannerView;
