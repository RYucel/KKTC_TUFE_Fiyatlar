
import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Controls from './components/Controls';
import PriceChart from './components/PriceChart';
import DataTable from './components/DataTable';
import { loadMarketData } from './services/dataService';
import { Currency, ScaleType, MarketDataPoint } from './types';

// TradingView inspired colors
const CHART_COLORS = [
  '#2962FF', // Blue
  '#E91E63', // Pink
  '#F6D046', // Yellow
  '#26A69A', // Teal
  '#FF5252', // Red
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#00BCD4', // Cyan
];

const App: React.FC = () => {
  const [data, setData] = useState<MarketDataPoint[]>([]);
  const [availableItems, setAvailableItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  
  const [selectedItems, setSelectedItems] = useState<string[]>(['Ekmek', 'Benzin']);
  const [currency, setCurrency] = useState<Currency>(Currency.TRY);
  const [scale, setScale] = useState<ScaleType>(ScaleType.LINEAR);
  const [dateRange, setDateRange] = useState<[string, string]>(['2015-01-01', new Date().toISOString().split('T')[0]]);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const result = await loadMarketData();
        setData(result.data);
        setAvailableItems(result.items);
        setIsFallback(!!result.isFallback);
        
        if (result.data.length > 0) {
             const min = result.data[0].date;
             const max = result.data[result.data.length - 1].date;
             
             // If using fallback (short duration), adjust range to fit data
             if (result.isFallback) {
                 setDateRange([min, max]);
             } else {
                 // Default to full range or last 5 years if full data
                 setDateRange(['2020-01-01', max]);
             }
             
             // Ensure selected items exist in the loaded dataset
             const validItems = result.items;
             const newSelection = selectedItems.filter(i => validItems.includes(i));
             if (newSelection.length === 0 && validItems.length > 0) {
                 setSelectedItems(validItems.slice(0, 2));
             }
        }
        setLoading(false);
    };
    fetchData();
  }, []);

  // Filter data based on date range
  const filteredData = useMemo(() => {
    if (data.length === 0) return [];
    const start = new Date(dateRange[0]).getTime();
    const end = new Date(dateRange[1]).getTime();
    return data.filter(d => d.timestamp >= start && d.timestamp <= end);
  }, [data, dateRange]);

  const minDataDate = data.length > 0 ? data[0].date : '2015-01-01';
  const maxDataDate = data.length > 0 ? data[data.length - 1].date : new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500 selection:text-white flex flex-col">
      <Header />
      
      <main className="flex flex-col h-full flex-1">
        {loading ? (
             <div className="flex-1 flex items-center justify-center">
                 <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-400 text-sm">Veriler Yükleniyor...</span>
                 </div>
             </div>
        ) : (
            <>
                {isFallback && (
                    <div className="bg-yellow-900/40 border-b border-yellow-700/50 px-4 py-3 flex items-center justify-center gap-2 text-yellow-200 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>
                            <strong>Tam Veri Seti Yüklenemedi:</strong> 'GRETL_TUFE.csv' dosyası bulunamadı. Son 1 yıllık örnek veri gösteriliyor. (Dosyayı 'public' klasörüne ekleyiniz)
                        </span>
                    </div>
                )}
                
                <Controls 
                  selectedItems={selectedItems}
                  onItemsChange={setSelectedItems}
                  currency={currency}
                  onCurrencyChange={setCurrency}
                  scale={scale}
                  onScaleChange={setScale}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  minDate={minDataDate}
                  maxDate={maxDataDate}
                  availableItems={availableItems}
                />

                <div className="p-4 lg:p-6 space-y-6 flex-1">
                  
                  {/* Chart Section */}
                  <div className="w-full">
                     <div className="flex items-center justify-between mb-4">
                       <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                         Piyasa Performansı
                         <span className="px-2 py-0.5 rounded bg-slate-800 text-xs text-slate-400 border border-slate-700">
                            {currency}
                         </span>
                       </h2>
                       {selectedItems.length > 0 && (
                           <div className="flex gap-2 flex-wrap justify-end">
                             {selectedItems.map((item, i) => (
                                <div key={item} className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded border border-slate-700">
                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: CHART_COLORS[i % CHART_COLORS.length]}}></div>
                                    <span className="text-xs text-slate-300">{item}</span>
                                </div>
                             ))}
                           </div>
                       )}
                     </div>
                     
                     <PriceChart 
                        data={filteredData} 
                        selectedItems={selectedItems}
                        currency={currency}
                        scale={scale}
                        colors={CHART_COLORS}
                     />
                  </div>

                  {/* Data Table Section */}
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100 mb-4">Tarihsel Veriler</h2>
                    <DataTable 
                        data={filteredData}
                        selectedItems={selectedItems}
                        currency={currency}
                    />
                  </div>

                </div>
            </>
        )}
      </main>
    </div>
  );
};

export default App;
