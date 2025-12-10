import React, { useState, useRef, useEffect } from 'react';
import { Currency, ScaleType } from '../types';
import { availableItems } from '../services/dataService';

interface ControlsProps {
  selectedItems: string[];
  onItemsChange: (items: string[]) => void;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  scale: ScaleType;
  onScaleChange: (s: ScaleType) => void;
  dateRange: [string, string];
  onDateRangeChange: (range: [string, string]) => void;
  minDate: string;
  maxDate: string;
}

const Controls: React.FC<ControlsProps> = ({
  selectedItems,
  onItemsChange,
  currency,
  onCurrencyChange,
  scale,
  onScaleChange,
  dateRange,
  onDateRangeChange,
  minDate,
  maxDate
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleItem = (item: string) => {
    if (selectedItems.includes(item)) {
      onItemsChange(selectedItems.filter(i => i !== item));
    } else {
      onItemsChange([...selectedItems, item]);
    }
  };

  const filteredItems = availableItems.filter(item => 
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMonth = (dateStr: string) => {
      if (!dateStr) return '';
      return dateStr.substring(0, 7);
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-20 shadow-lg">
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        
        {/* Item Selector */}
        <div className="relative w-full lg:w-1/3" ref={dropdownRef}>
          <label className="block text-xs text-slate-400 mb-1">Ürün Seçimi</label>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
          >
            <span className="truncate">
              {selectedItems.length > 0 ? `${selectedItems.length} ürün seçildi` : 'Ürün seçiniz...'}
            </span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-xl z-50 max-h-[400px] flex flex-col">
              <div className="p-2 border-b border-slate-700">
                <input
                  type="text"
                  placeholder="Ürün ara..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {filteredItems.map(item => (
                  <label key={item} className="flex items-center gap-2 p-1.5 hover:bg-slate-700 rounded cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item)}
                      onChange={() => toggleItem(item)}
                      className="rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-offset-slate-800 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{item}</span>
                  </label>
                ))}
                {filteredItems.length === 0 && (
                  <div className="text-center text-slate-500 py-4 text-sm">Ürün bulunamadı</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
             {/* Currency */}
             <div>
                <label className="block text-xs text-slate-400 mb-1">Para Birimi</label>
                <div className="flex bg-slate-800 rounded-md border border-slate-700 p-0.5">
                    {Object.values(Currency).map(c => (
                        <button
                            key={c}
                            onClick={() => onCurrencyChange(c)}
                            className={`px-3 py-1.5 text-xs font-medium rounded ${currency === c ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
             </div>

             {/* Scale - Converted to Buttons */}
             <div>
                <label className="block text-xs text-slate-400 mb-1">Ölçek</label>
                <div className="flex bg-slate-800 rounded-md border border-slate-700 p-0.5">
                    {Object.values(ScaleType).map(s => (
                        <button
                            key={s}
                            onClick={() => onScaleChange(s)}
                            className={`px-3 py-1.5 text-xs font-medium rounded ${scale === s ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
             </div>

             {/* Date Range - Using Month Picker */}
             <div className="flex gap-2">
                <div>
                    <label className="block text-xs text-slate-400 mb-1">Başlangıç</label>
                    <input 
                        type="month" 
                        value={formatMonth(dateRange[0])} 
                        min={formatMonth(minDate)}
                        max={formatMonth(dateRange[1])}
                        onChange={(e) => onDateRangeChange([`${e.target.value}-01`, dateRange[1]])}
                        className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-1">Bitiş</label>
                    <input 
                        type="month" 
                        value={formatMonth(dateRange[1])} 
                        min={formatMonth(dateRange[0])}
                        max={formatMonth(maxDate)}
                        onChange={(e) => onDateRangeChange([dateRange[0], `${e.target.value}-01`])}
                        className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
             </div>
        </div>
      </div>
      
      {/* Selected Items Tags */}
      <div className="mt-3 flex flex-wrap gap-2">
        {selectedItems.map(item => (
            <span key={item} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-300">
                {item}
                <button onClick={() => toggleItem(item)} className="hover:text-red-400 focus:outline-none">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </span>
        ))}
        {selectedItems.length === 0 && (
            <span className="text-xs text-slate-500 italic">Ürün seçilmedi. Listeden ürün ekleyiniz.</span>
        )}
      </div>

    </div>
  );
};

export default Controls;