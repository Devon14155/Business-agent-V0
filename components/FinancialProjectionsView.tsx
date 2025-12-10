
import React, { useState, useEffect } from 'react';
import { DownloadIcon, MagicIcon, SaveIcon, CheckIcon } from './icons';
import { getFinancialModelAnalysis, saveFinancialModel, loadFinancialModel } from '../usecases/financialProjectionsUseCase';
import { observabilityService } from '../services/observabilityService';

// --- TYPE DEFINITIONS ---
interface SimulationInputs {
    initialInvestment: number;
    monthlyUserGrowth: number;
    conversionRate: number;
    arpu: number;
    cogsPercentage: number;
    marketingSpend: number;
    salaries: number;
    softwareCosts: number;
}

interface FinancialRow {
    item: string;
    values: number[];
    isNegative?: boolean;
}

interface Kpi {
    label: string;
    value: string;
}

interface Projections {
    kpiData: Kpi[];
    financialData: FinancialRow[];
}

// --- INITIAL STATE & CONSTANTS ---
const PROJECTION_MONTHS = 24;

const initialInputs: SimulationInputs = {
    initialInvestment: 100000,
    monthlyUserGrowth: 20,
    conversionRate: 2,
    arpu: 50,
    cogsPercentage: 20,
    marketingSpend: 5000,
    salaries: 15000,
    softwareCosts: 2000,
};

// --- HELPER FUNCTIONS ---
const formatCurrency = (value: number) => {
    const isNegative = value < 0;
    const absoluteValue = Math.abs(value);
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(absoluteValue);
    return isNegative ? `(${formatted})` : formatted;
};

// --- UI COMPONENTS ---
const InputField: React.FC<{
    label: string;
    id: keyof SimulationInputs;
    value: number;
    onChange: (id: keyof SimulationInputs, value: number) => void;
    prefix?: string;
    suffix?: string;
}> = ({ label, id, value, onChange, prefix, suffix }) => (
    <div className="group">
        <label htmlFor={id} className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{label}</label>
        <div className="relative">
            {prefix && <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-medium select-none">{prefix}</span>}
            <input
                type="number"
                id={id}
                name={id}
                value={value}
                onChange={(e) => onChange(id, parseFloat(e.target.value) || 0)}
                className={`w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''}`}
            />
            {suffix && <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 font-medium select-none">{suffix}</span>}
        </div>
    </div>
);

// --- MAIN COMPONENT ---
const FinancialProjectionsView: React.FC = () => {
    const [inputs, setInputs] = useState<SimulationInputs>(initialInputs);
    const [projections, setProjections] = useState<Projections | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState('');

    useEffect(() => {
        const loadModel = async () => {
            const savedInputs = await loadFinancialModel(initialInputs);
            setInputs(savedInputs);
        };
        loadModel();
    }, []);

    const handleInputChange = (id: keyof SimulationInputs, value: number) => {
        setInputs(prev => ({ ...prev, [id]: value }));
    };

    const handleRunSimulation = () => {
        setIsLoading(true);
        setAnalysis(''); // Clear old analysis

        setTimeout(() => {
            let totalUsers = 0;
            const monthlyData: { [key: string]: number[] } = {
                revenue: [], cogs: [], grossMargin: [], opEx: [], netProfit: [], cashBalance: [],
            };
            let lastMonthCash = inputs.initialInvestment;
            let cumulativeProfit = 0;
            let breakEvenMonth: number | null = null;
            let runwayEndMonth: number | null = null;

            for (let i = 0; i < PROJECTION_MONTHS; i++) {
                const newUsers = totalUsers === 0 ? 100 : totalUsers * (inputs.monthlyUserGrowth / 100);
                totalUsers += newUsers;
                
                const revenue = totalUsers * (inputs.conversionRate / 100) * inputs.arpu;
                const cogs = revenue * (inputs.cogsPercentage / 100);
                const grossMargin = revenue - cogs;
                const opEx = inputs.marketingSpend + inputs.salaries + inputs.softwareCosts;
                const netProfit = grossMargin - opEx;
                const cashBalance = lastMonthCash + netProfit;
                
                if (breakEvenMonth === null && netProfit > 0) breakEvenMonth = i + 1;
                if (runwayEndMonth === null && cashBalance < 0) runwayEndMonth = i;

                lastMonthCash = cashBalance;
                cumulativeProfit += netProfit;

                Object.keys(monthlyData).forEach(key => monthlyData[key].push((eval as any)(key)));
            }

            const newFinancialData: FinancialRow[] = [
                { item: 'Revenue', values: monthlyData.revenue },
                { item: 'COGS', values: monthlyData.cogs },
                { item: 'Gross Margin', values: monthlyData.grossMargin },
                { item: 'Operating Expenses', values: monthlyData.opEx },
                { item: 'Net Profit/Loss', values: monthlyData.netProfit, isNegative: true },
                { item: 'Ending Cash Balance', values: monthlyData.cashBalance, isNegative: true },
            ];
            
            const newKpiData: Kpi[] = [
                { label: 'Projected Runway', value: runwayEndMonth ? `${runwayEndMonth} Months` : `> ${PROJECTION_MONTHS} Months` },
                { label: 'Break-Even Point', value: breakEvenMonth ? `Month ${breakEvenMonth}` : 'N/A' },
                { label: 'Avg. Burn Rate', value: formatCurrency(Math.abs(cumulativeProfit / PROJECTION_MONTHS)) + '/mo' },
            ];

            setProjections({ kpiData: newKpiData, financialData: newFinancialData });
            setIsLoading(false);
        }, 50);
    };
    
    const handleAiAnalysis = async () => {
        if (!projections) return;
        setIsAnalyzing(true);
        setAnalysis('');
        const result = await getFinancialModelAnalysis(inputs, projections);
        setAnalysis(result);
        setIsAnalyzing(false);
    };

    const handleExport = () => {
        if (!projections) return;
        const headers = ['Financial Item', ...Array.from({ length: PROJECTION_MONTHS }, (_, i) => `Month ${i + 1}`)];
        const rows = projections.financialData.map(row => 
            [row.item, ...row.values.map(val => val.toFixed(2))].join(',')
        );
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        
        const link = document.createElement('a');
        link.href = encodeURI(csvContent);
        link.download = 'financial_projections.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveModel = async () => {
        await saveFinancialModel(inputs);
        observabilityService.logInfo('Financial model saved');
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="flex h-full bg-gray-50 dark:bg-brand-dark text-gray-900 dark:text-gray-100 overflow-hidden">
            <aside className="w-80 bg-white dark:bg-brand-medium border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0 z-20">
                <header className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="font-bold text-lg">Assumptions</h2>
                </header>
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    {Object.entries({
                        initialInvestment: {label:"Initial Investment", prefix:"$"}, monthlyUserGrowth: {label:"Monthly User Growth", suffix:"%"},
                        conversionRate: {label:"Conversion Rate", suffix:"%"}, arpu: {label:"Avg. Revenue / User (ARPU)", prefix:"$"},
                        cogsPercentage: {label:"COGS (% of Revenue)", suffix:"%"}, marketingSpend: {label:"Monthly Marketing Spend", prefix:"$"},
                        salaries: {label:"Monthly Salaries", prefix:"$"}, softwareCosts: {label:"Monthly Software Costs", prefix:"$"}
                    }).map(([key, props]) => (
                         <InputField key={key} label={props.label} id={key as keyof SimulationInputs} value={inputs[key as keyof SimulationInputs]} onChange={handleInputChange} {...props}/>
                    ))}
                </div>
                <footer className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10">
                    <button onClick={handleRunSimulation} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5">
                        {isLoading ? 'Simulating...' : 'Run Simulation'}
                    </button>
                </footer>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-brand-dark">
                <header className="h-20 flex justify-between items-center px-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-brand-medium">
                     <h2 className="text-xl font-bold text-gray-900 dark:text-white">Financial Projections</h2>
                     <div className="flex items-center gap-3">
                        <button onClick={handleAiAnalysis} disabled={!projections || isAnalyzing} className="flex items-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm">
                           <MagicIcon className="w-4 h-4"/>
                           <span>{isAnalyzing ? 'Analyzing...' : 'AI Analysis'}</span>
                       </button>
                        <button onClick={handleSaveModel} className="flex items-center gap-2 bg-white dark:bg-brand-light border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                            {isSaved ? (
                                <>
                                    <CheckIcon className="w-4 h-4 text-green-500" />
                                    <span>Saved</span>
                                </>
                            ) : (
                                <>
                                    <SaveIcon className="w-4 h-4" />
                                    <span>Save</span>
                                </>
                            )}
                        </button>
                        <button onClick={handleExport} disabled={!projections || isLoading} className="flex items-center gap-2 bg-white dark:bg-brand-light border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50">
                            <DownloadIcon className="w-4 h-4" />
                            <span>Export</span>
                        </button>
                    </div>
                </header>
                <main className="flex-1 p-8 overflow-auto">
                    {!projections && !isLoading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center max-w-md text-gray-500 dark:text-gray-400">
                                <div className="bg-white dark:bg-brand-medium p-8 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-700">
                                     <SaveIcon className="w-12 h-12 text-blue-500 opacity-60" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Ready to Forecast</h3>
                                <p className="leading-relaxed">Adjust your assumptions in the sidebar and click "Run Simulation" to generate your 24-month financial forecast.</p>
                            </div>
                        </div>
                    )}
                    {(isAnalyzing || analysis) && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-2xl mb-8 border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
                             <h3 className="font-bold text-lg mb-3 text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                <MagicIcon className="w-5 h-5" /> AI Insight
                            </h3>
                            {isAnalyzing ? (
                                <div className="space-y-3 animate-pulse">
                                    <div className="h-2 bg-indigo-200 dark:bg-indigo-800 rounded w-3/4"></div>
                                    <div className="h-2 bg-indigo-200 dark:bg-indigo-800 rounded w-full"></div>
                                    <div className="h-2 bg-indigo-200 dark:bg-indigo-800 rounded w-5/6"></div>
                                </div>
                            ) : (
                                <div className="prose prose-sm prose-indigo max-w-none text-indigo-800 dark:text-indigo-100/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }}></div>
                            )}
                        </div>
                    )}
                    {(isLoading || projections) && (
                        <div className="space-y-8 animate-fade-in pb-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {(projections?.kpiData || Array(3).fill({})).map((kpi, index) => (
                                    <div key={index} className={`bg-white dark:bg-brand-medium p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm ${isLoading ? 'animate-pulse' : ''}`}>
                                        <p className={`text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ${isLoading ? 'h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-2' : 'mb-2'}`}>{kpi.label}</p>
                                        <p className={`text-4xl font-bold text-gray-900 dark:text-white tracking-tight ${isLoading ? 'h-10 bg-gray-100 dark:bg-gray-800 rounded w-3/4' : ''}`}>{kpi.value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white dark:bg-brand-medium rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1200px] text-sm text-left">
                                        <thead>
                                            <tr className="bg-gray-50/80 dark:bg-black/20 border-b border-gray-200 dark:border-gray-700">
                                                <th className="py-4 px-6 font-semibold text-gray-900 dark:text-white sticky left-0 bg-gray-50 dark:bg-brand-medium z-10 border-r border-gray-200 dark:border-gray-700">Financial Item</th>
                                                {Array.from({ length: PROJECTION_MONTHS }, (_, i) => `Month ${i + 1}`).map(m => (
                                                    <th key={m} className="py-4 px-4 font-semibold text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">{m}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {(projections?.financialData || Array(6).fill({item:'', values:[]})).map((row, rI) => (
                                                <tr key={rI} className={`${isLoading ? 'animate-pulse' : 'hover:bg-gray-50 dark:hover:bg-white/5 transition-colors'}`}>
                                                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-brand-medium border-r border-gray-100 dark:border-gray-800 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                                        <span className={isLoading ? 'h-5 bg-gray-100 dark:bg-gray-800 rounded block w-32' : ''}>{row.item}</span>
                                                    </td>
                                                    {(row.values.length > 0 ? row.values : Array(PROJECTION_MONTHS).fill(0)).map((val, cI) => (
                                                        <td key={cI} className={`py-4 px-4 text-right font-mono ${!isLoading && row.isNegative && val < 0 ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            {isLoading ? <span className="h-5 bg-gray-100 dark:bg-gray-800 rounded block w-16 ml-auto"></span> : formatCurrency(val)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default FinancialProjectionsView;
