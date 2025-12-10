
import React, { useState } from 'react';
import { generateAiImage } from '../usecases/imageGeneratorUseCase';
import { DownloadIcon, ImageIcon, MagicIcon } from './icons';
import { observabilityService } from '../services/observabilityService';

const ImageGeneratorView: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('A modern, minimalist logo for a tech startup called "Synergy AI", blue and silver, on a dark background');
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setGeneratedImageUrl(null);
        setError('');
        observabilityService.logInfo(`Image generation requested with prompt: "${prompt}"`);
        try {
            const imageUrl = await generateAiImage(prompt, aspectRatio);
            setGeneratedImageUrl(imageUrl);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-full bg-gray-50 dark:bg-brand-dark text-gray-900 dark:text-gray-100 overflow-hidden">
            <aside className="w-80 bg-white dark:bg-brand-medium border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0 z-20">
                <header className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="font-bold text-lg">Studio Controls</h2>
                </header>
                <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                    <div>
                        <label htmlFor="prompt" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Prompt</label>
                        <textarea
                            id="prompt"
                            rows={6}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the image you want to create..."
                            className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-shadow text-sm leading-relaxed"
                        />
                    </div>
                    <div>
                        <label htmlFor="aspectRatio" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Aspect Ratio</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                                <button 
                                    key={ratio}
                                    onClick={() => setAspectRatio(ratio)}
                                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${aspectRatio === ratio ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10">
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5">
                        <MagicIcon className="w-5 h-5" />
                        <span>{isLoading ? 'Dreaming...' : 'Generate Image'}</span>
                    </button>
                </div>
            </aside>
            
            <div className="flex-1 flex flex-col min-w-0 bg-gray-100/50 dark:bg-black/20">
                <header className="h-20 flex items-center px-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-brand-medium">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Canvas Preview</h2>
                </header>
                <main className="flex-1 p-8 flex items-center justify-center overflow-auto relative">
                     {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                    
                    {isLoading && (
                        <div className="text-center z-10">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg animate-pulse">Creating your masterpiece...</p>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-5 rounded-2xl max-w-md text-center shadow-sm z-10" role="alert">
                           <strong className="font-bold block mb-2 text-lg">Generation Failed</strong>
                           <span className="text-sm opacity-90">{error}</span>
                        </div>
                    )}
                    {!isLoading && !error && generatedImageUrl && (
                        <div className="relative group max-w-full max-h-full z-10 p-4">
                            <img src={generatedImageUrl} alt="Generated by AI" className="rounded-xl shadow-2xl max-w-full max-h-[calc(100vh-200px)] object-contain bg-white dark:bg-black ring-1 ring-black/5 dark:ring-white/10" />
                            <a 
                                href={generatedImageUrl} 
                                download="generated-image.jpg"
                                className="absolute bottom-8 right-8 flex items-center gap-2 bg-white/90 dark:bg-black/80 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 backdrop-blur-md hover:bg-white dark:hover:bg-black"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                <span>Download</span>
                            </a>
                        </div>
                    )}
                     {!isLoading && !error && !generatedImageUrl && (
                        <div className="text-center text-gray-400 dark:text-gray-600 z-10">
                            <div className="bg-white dark:bg-brand-medium p-10 rounded-full inline-flex mb-8 shadow-sm border border-gray-200 dark:border-gray-800">
                                <ImageIcon className="w-20 h-20 opacity-20" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Ready to Create</h3>
                            <p className="max-w-md mx-auto leading-relaxed">Enter a prompt in the sidebar to generate high-quality AI images for your business.</p>
                        </div>
                     )}
                </main>
            </div>
        </div>
    );
};
export default ImageGeneratorView;
