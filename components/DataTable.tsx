import React, { useMemo } from 'react';
import { MarketDataPoint, Currency } from '../types';

interface DataTableProps {
  data: MarketDataPoint[];
  selectedItems: string[];
  currency: Currency;
}

const DataTable: React.FC<DataTableProps> = ({ data, selectedItems, currency }) => {
  // Sort reverse chronological
  const reversedData = useMemo(() => [...data].reverse(), [data]);

  if (selectedItems.length === 0) return null;

  return (
    <div className="mt-6 border border-slate-800 rounded-lg overflow-hidden bg-slate-900">
      <div className="max-h-[400px] overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 uppercase bg-slate-950 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 font-medium border-b border-slate-800">Tarih</th>
              {selectedItems.map(item => (
                <th key={item} className="px-6 py-3 font-medium border-b border-slate-800">
                  {item} <span className="text-slate-600 text-[10px]">({currency})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {reversedData.map((row) => {
               const rates = row._rates as any;
               const dateObj = new Date(row.date);
               const formattedDate = dateObj.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });

               return (
                <tr key={row.date} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 text-slate-300 font-mono whitespace-nowrap">{formattedDate}</td>
                    {selectedItems.map(item => {
                        let val = row[item] as number;
                        if(val === null || val === undefined) return <td key={`${row.date}-${item}`} className="px-6 py-3 text-slate-600">-</td>;
                        
                        if (currency !== Currency.TRY && rates) {
                            if (currency === Currency.BRENT) {
                                const brentTL = rates['BRENT_TL'];
                                if (brentTL) val = val / brentTL;
                                else val = 0; 
                            } else {
                                const rate = rates[currency];
                                if (rate) val = val / rate;
                                else val = 0;
                            }
                        }

                        return (
                            <td key={`${row.date}-${item}`} className="px-6 py-3 text-slate-200">
                                {val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                        );
                    })}
                </tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;