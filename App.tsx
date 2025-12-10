import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Controls from './components/Controls';
import PriceChart from './components/PriceChart';
import DataTable from './components/DataTable';
import { marketData } from './services/dataService';
import { Currency, ScaleType } from './types';

// TradingView inspired colors
const CHART_COLORS = [
  '#2962FF', // Blue
  '#E91E63', // Pink
  '#F6D046', // Yellow
  '#26A69A', // Teal
  '#FF5252', // Red
];

const App: React.FC = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>(['Ekmek', 'Benzin']);
  const [currency, setCurrency] = useState<Currency>(Currency.TRY);
  const [scale, setScale] = useState<ScaleType>(ScaleType.LINEAR);
  
  // Initialize date range based on available data
  // Safe access to marketData in case it's empty
  const minDataDate = marketData.length > 0 ? marketData[0].date : '2015-01-01';
  const maxDataDate = marketData.length > 0 ? marketData[marketData.length - 1].date : new Date().toISOString().split('T')[0];
  
  const [dateRange, setDateRange] = useState<[string, string]>([minDataDate, maxDataDate]);

  // Force update if data loads asynchronously (not applicable here but good practice)
  useEffect(() => {
     if(marketData.length > 0) {
         setDateRange([marketData[0].date, marketData[marketData.length - 1].date]);
     }
  }, []);

  // Filter data based on date range
  const filteredData = useMemo(() => {
    const start = new Date(dateRange[0]).getTime();
    const end = new Date(dateRange[1]).getTime();
    return marketData.filter(d => d.timestamp >= start && d.timestamp <= end);
  }, [dateRange]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500 selection:text-white">
      <Header />
      
      <main className="flex flex-col h-full">
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
        />

        <div className="p-4 lg:p-6 space-y-6">
          
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
                   <div className="flex gap-2">
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
      </main>
    </div>
  );
};

export default App;