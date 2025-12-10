
import React from 'react';
import { DatabaseIcon } from './icons';
import { storageService } from '../storage/storageService';

const SettingsView: React.FC = () => {

    const handleExportData = async () => {
        try {
            const dataToExport = await storageService.exportAllData();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "ai_pocket_expert_data.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } catch (error) {
            console.error("Failed to export data:", error);
            alert("An error occurred while exporting your data.");
        }
    };

    const handleResetApp = async () => {
        if (window.confirm('Are you sure you want to reset the application? All your data (memories, financial models, and canvas content) will be deleted. This action cannot be undone.')) {
            try {
                await storageService.resetAllData();
                alert('Application has been reset.');
                window.location.reload();
            } catch (error) {
                console.error("Failed to reset app:", error);
                alert("An error occurred while resetting the application.");
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-brand-dark overflow-y-auto">
            <header className="h-20 flex-shrink-0 flex items-center px-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-brand-medium">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
            </header>
            <main className="flex-1 p-8">
                <div className="max-w-4xl mx-auto space-y-10">
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                <DatabaseIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Data & Privacy</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your local data storage</p>
                            </div>
                        </div>
                        
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {/* Export Card */}
                             <div className="bg-white dark:bg-brand-medium rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Export Data</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 h-10">Download a complete JSON backup of your chats, canvases, and models.</p>
                                <button onClick={handleExportData} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white font-medium py-2.5 px-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    Download Backup
                                </button>
                             </div>
                             
                             {/* Reset Card */}
                              <div className="bg-white dark:bg-brand-medium rounded-2xl p-6 border border-red-100 dark:border-red-900/30 shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-red-600 dark:text-red-400 mb-2">Factory Reset</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 h-10">Permanently delete all local data and restore the app to its initial state.</p>
                                <button onClick={handleResetApp} className="w-full bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-medium py-2.5 px-4 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
                                    Reset Application
                                </button>
                             </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default SettingsView;
