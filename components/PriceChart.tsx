import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { MarketDataPoint, Currency, ScaleType } from '../types';

interface PriceChartProps {
  data: MarketDataPoint[];
  selectedItems: string[];
  currency: Currency;
  scale: ScaleType;
  colors: string[];
}

const PriceChart: React.FC<PriceChartProps> = ({ data, selectedItems, currency, scale, colors }) => {

  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    const baseValues: Record<string, number> = {};
    
    // Find base values for percentage calculation (first valid data point in range)
    if (scale === ScaleType.PERCENTAGE) {
        selectedItems.forEach(item => {
            // Find first non-null value for this item
            const firstValidRow = data.find(r => r[item] !== null && r[item] !== undefined);
            if (firstValidRow) {
                const val = firstValidRow[item] as number;
                const rates = firstValidRow._rates as any;
                let converted = val;
                if (currency !== Currency.TRY && rates) {
                   if (currency === Currency.BRENT) converted = val / (rates['BRENT_TL'] || 1);
                   else converted = val / (rates[currency] || 1);
                }
                baseValues[item] = converted;
            }
        });
    }

    return data.map(row => {
      const newRow: any = { date: row.date, timestamp: row.timestamp };
      const rates = row._rates as any;

      selectedItems.forEach(item => {
        let val = row[item] as number;
        
        if (val === null || val === undefined) {
             newRow[item] = null;
             return;
        }

        // Currency Conversion
        if (currency !== Currency.TRY) {
            if (rates) {
                if (currency === Currency.BRENT) {
                    const brentTL = rates['BRENT_TL'];
                    if (brentTL) val = val / brentTL;
                    else val = null as any; 
                } else {
                    const rate = rates[currency];
                    if (rate) val = val / rate;
                    else val = null as any;
                }
            } else {
                val = null as any;
            }
        }

        // Scale Calculation
        if (val !== null) {
            if (scale === ScaleType.PERCENTAGE) {
                const base = baseValues[item];
                if (base) {
                    newRow[item] = ((val - base) / base) * 100;
                } else {
                    newRow[item] = 0;
                }
            } else {
                newRow[item] = val;
            }
        }
      });
      return newRow;
    });
  }, [data, selectedItems, currency, scale]);

  if (selectedItems.length === 0) {
    return (
        <div className="h-[500px] w-full flex items-center justify-center text-slate-500 bg-slate-900 border border-slate-800 rounded-lg">
            <p>Veri görüntülemek için ürün seçiniz</p>
        </div>
    );
  }

  const formatYAxis = (val: number) => {
      if (scale === ScaleType.PERCENTAGE) return `${val.toFixed(0)}%`;
      if (Math.abs(val) < 0.001) return val.toFixed(5);
      if (Math.abs(val) < 1) return val.toFixed(3);
      if (Math.abs(val) < 10) return val.toFixed(2);
      return val.toFixed(0);
  };

  const formatXAxis = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
      } catch (e) {
          return dateStr;
      }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      let dateLabel = label;
      try {
          const date = new Date(label);
          dateLabel = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) {}

      return (
        <div className="bg-slate-800/95 border border-slate-700 p-3 rounded-md shadow-2xl backdrop-blur-sm text-sm z-50">
          <p className="text-slate-400 mb-2 font-mono text-xs">{dateLabel}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-[120px]">
                    <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
                    <span className="text-slate-300 font-medium truncate max-w-[150px]">{entry.name}</span>
                </div>
                <span className="text-slate-100 font-mono ml-auto">
                    {entry.value !== null ? 
                        (scale === ScaleType.PERCENTAGE 
                            ? `${entry.value > 0 ? '+' : ''}${entry.value.toFixed(2)}%` 
                            : entry.value.toLocaleString('tr-TR', { maximumFractionDigits: 4 }))
                        : 'N/A'}
                </span>
                </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Safe domain for log scale
  const isLogSafe = scale === ScaleType.LOG && !chartData.some(row => selectedItems.some(item => {
      const val = row[item];
      return typeof val === 'number' && val <= 0;
  }));
  
  // Fallback to linear if log is unsafe (negative/zero values)
  const effectiveScale = isLogSafe ? 'log' : 'linear';

  return (
    <div className="h-[500px] w-full bg-slate-900 border border-slate-800 rounded-lg p-1 sm:p-4" style={{ minHeight: '500px' }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={true} horizontal={true} />
          <XAxis 
            dataKey="date" 
            stroke="#64748b" 
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
            tickFormatter={formatXAxis}
            minTickGap={40}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
          />
          <YAxis 
            scale={effectiveScale}
            domain={['auto', 'auto']}
            stroke="#64748b"
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
            tickFormatter={formatYAxis}
            width={55}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeDasharray: '4 4' }} />
          <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
          {scale === ScaleType.PERCENTAGE && (
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
          )}
          {selectedItems.map((item, index) => (
            <Line
              key={item}
              type="monotone"
              dataKey={item}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#1e293b' }}
              connectNulls
              animationDuration={500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;