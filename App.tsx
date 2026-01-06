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
  
  const [selectedItems, setSelectedItems] = useState<string[]>(['Ekmek', 'Benzin']);
  const [currency, setCurrency] = useState<Currency>(Currency.TRY);
  const [scale, setScale] = useState<ScaleType>(ScaleType.LINEAR);
  const [dateRange, setDateRange] = useState<[string, string]>(['2015-01-01', new Date().toISOString().split('T')[0]]);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const { data: loadedData, items } = await loadMarketData();
        setData(loadedData);
        setAvailableItems(items);
        if (loadedData.length > 0) {
             const min = loadedData[0].date;
             const max = loadedData[loadedData.length - 1].date;
             setDateRange([min, max]);
             
             // If initial selection items aren't valid, pick first few
             if (!items.includes('Ekmek')) {
                 setSelectedItems(items.slice(0, 3));
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