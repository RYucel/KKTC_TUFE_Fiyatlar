import { ExchangeRates, MarketDataPoint, Currency } from '../types';

// FX Data Generation (Approximation for demo reliability if file is missing or truncated)
// This ensures we have rates even without a huge CSV string in the code.
const generateFXRates = (startYear: number, endYear: number): ExchangeRates => {
    const rates: ExchangeRates = {};
    let currentDate = new Date(`${startYear}-01-01`);
    const endDate = new Date(`${endYear}-12-01`);

    // Rough approximate key points for USD/TRY
    const keyPoints: Record<string, number> = {
        '2015-01': 2.33, '2016-01': 2.96, '2017-01': 3.77, '2018-01': 3.79,
        '2018-08': 6.55, '2019-01': 5.34, '2020-01': 5.95, '2020-11': 8.52,
        '2021-01': 7.37, '2021-12': 13.53, '2022-01': 13.43, '2022-12': 18.63,
        '2023-06': 23.60, '2024-01': 30.20, '2025-01': 36.50
    };

    while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;
        
        // Linear interpolation or nearest neighbor for simplicity in this generated fallback
        // In a real app, this would be a fetched static CSV like CPI.
        // We check if we have an exact match, otherwise interpolate
        let usdRate = 0;
        
        // Find surrounding keypoints
        const dates = Object.keys(keyPoints).sort();
        let prevDate = dates[0];
        let nextDate = dates[dates.length - 1];
        
        for (const d of dates) {
            if (d <= key) prevDate = d;
            if (d >= key && nextDate === dates[dates.length - 1]) {
                nextDate = d;
                if (d === key) break; 
            }
        }
        
        if (prevDate === nextDate) {
            usdRate = keyPoints[prevDate];
        } else {
            const prevTime = new Date(`${prevDate}-01`).getTime();
            const nextTime = new Date(`${nextDate}-01`).getTime();
            const currTime = new Date(`${key}-01`).getTime();
            const prevVal = keyPoints[prevDate];
            const nextVal = keyPoints[nextDate];
            const ratio = (currTime - prevTime) / (nextTime - prevTime);
            usdRate = prevVal + (nextVal - prevVal) * ratio;
        }

        rates[key] = {
            USD: usdRate,
            EUR: usdRate * 1.1, // Approximate
            GBP: usdRate * 1.25, // Approximate
            BRENT_TL: usdRate * 60, // Very rough approximation for oil in TL
            BRENT_USD: 60 // Placeholder
        };

        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return rates;
};

// We will load this async
export const loadMarketData = async (): Promise<{ data: MarketDataPoint[], items: string[] }> => {
    try {
        const response = await fetch('GRETL_TUFE.csv');
        if (!response.ok) throw new Error('Failed to load CSV');
        const csvText = await response.text();
        
        const rawCpiData = parseCSV(csvText);
        const fxMap = generateFXRates(2015, 2025);

        const marketData: MarketDataPoint[] = rawCpiData.map((row: any) => {
            const date = row.date;
            // Ensure we have a valid date
            if(!date) return null;
            
            const monthKey = date.substring(0, 7); 
            const rates = fxMap[monthKey];
            
            return {
                ...row,
                _rates: rates
            };
        }).filter((row): row is MarketDataPoint => row !== null && row.timestamp !== undefined)
        .sort((a, b) => a.timestamp - b.timestamp);

        const items = Object.keys(rawCpiData[0] || {})
            .filter(key => key !== 'date' && key !== 'timestamp' && key !== 'Tarih' && key !== '_rates');

        return { data: marketData, items };

    } catch (error) {
        console.error("Error loading market data:", error);
        return { data: [], items: [] };
    }
};

const parseCSV = (csv: string): any[] => {
  const lines = csv.replace(/\r/g, '').trim().split('\n');
  if (lines.length < 2) return [];

  // Parse Headers
  const headerLine = lines[0];
  const headers: string[] = [];
  let currentHeader = '';
  let inQuotes = false;
  
  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      headers.push(currentHeader.trim());
      currentHeader = '';
    } else {
      currentHeader += char;
    }
  }
  headers.push(currentHeader.trim());

  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values: string[] = [];
    let currentValue = '';
    inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue);

    // Create object
    const row: any = {};
    headers.forEach((header, index) => {
      let val = values[index];
      // Clean quotes
      if (val && val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      
      if (header === 'Tarih' || header === 'Date') {
        // Handle DD/MM/YYYY
        if (val) {
             let d, m, y;
            if (val.includes('/')) {
                const parts = val.split('/');
                if(parts.length === 3) {
                     d = parts[0].trim().padStart(2, '0');
                     m = parts[1].trim().padStart(2, '0');
                     y = parts[2].trim();
                }
            } else if (val.includes('-')) {
                 const parts = val.split('-');
                 if (parts.length === 3) {
                     // check if YYYY-MM-DD or DD-MM-YYYY
                     if (parts[0].length === 4) {
                         y = parts[0]; m = parts[1]; d = parts[2];
                     } else {
                         d = parts[0]; m = parts[1]; y = parts[2];
                     }
                 }
            }
            
            if (y && m && d) {
                row['date'] = `${y}-${m}-${d}`;
                row['timestamp'] = new Date(row['date']).getTime();
            }
        }
      } else {
        // Try parsing number, allow for empty strings
        if (!val || val.trim() === '') {
            row[header] = null;
        } else {
            const num = parseFloat(val);
            row[header] = isNaN(num) ? null : num;
        }
      }
    });
    
    if (row['date']) {
        data.push(row);
    }
  }
  return data;
};
