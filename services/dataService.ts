
import { ExchangeRates, MarketDataPoint } from '../types';

// Fallback data: Jan 2024 - Jan 2025 (Essential items only)
// This ensures the app runs even if the full CSV fetch fails or is not found (404).
const FALLBACK_CSV = `Tarih,Pirinç,Ekmek,Dana Eti (Taze),Süt,Tavuk Yumurtası,Ayçiçek Yağı,Benzin,Elektrik Ücreti (Fatura)
01/01/2024,84.85,59.72,573.86,52.61,5.28,85.68,26.94,56.26
01/02/2024,86.35,69.14,580.97,59.73,5.64,85.39,33.27,62.28
01/03/2024,105.43,74.97,608.42,51.58,5.68,85.40,35.26,59.23
01/04/2024,113.17,75.40,639.99,55.34,5.67,89.57,37.42,52.61
01/05/2024,113.94,75.75,642.73,56.58,5.68,89.56,36.67,59.15
01/06/2024,127.23,76.65,697.35,61.39,5.72,92.23,35.95,57.89
01/07/2024,124.15,77.80,747.42,61.36,5.74,93.15,37.64,59.15
01/08/2024,126.96,78.26,769.67,59.36,5.74,92.62,37.42,59.15
01/09/2024,124.56,78.65,762.88,57.98,5.74,92.62,38.17,59.49
01/10/2024,122.02,78.85,765.82,58.59,5.74,94.52,38.29,62.28
01/11/2024,106.34,79.03,790.12,61.98,5.74,103.62,37.07,73.67
01/12/2024,109.94,79.05,791.76,59.62,5.89,109.18,37.64,76.39
01/01/2025,111.93,79.21,813.60,58.29,6.03,107.03,32.43,87.51
`;

// FX Data Generation (Approximation for demo reliability)
const generateFXRates = (startYear: number, endYear: number): ExchangeRates => {
    const rates: ExchangeRates = {};
    let currentDate = new Date(`${startYear}-01-01`);
    const endDate = new Date(`${endYear}-12-01`);

    // Key points for USD/TRY
    const keyPoints: Record<string, number> = {
        '2015-01': 2.33, '2016-01': 2.96, '2017-01': 3.77, '2018-01': 3.79,
        '2018-08': 6.55, '2019-01': 5.34, '2020-01': 5.95, '2020-11': 8.52,
        '2021-01': 7.37, '2021-12': 13.53, '2022-01': 13.43, '2022-12': 18.63,
        '2023-06': 23.60, '2024-01': 30.20, '2025-01': 36.50, '2025-09': 45.00
    };

    while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;
        
        let usdRate = 0;
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
            EUR: usdRate * 1.1,
            GBP: usdRate * 1.25,
            BRENT_TL: usdRate * 60,
            BRENT_USD: 60
        };

        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return rates;
};

export const loadMarketData = async (): Promise<{ data: MarketDataPoint[], items: string[], isFallback?: boolean }> => {
    let csvText = '';
    let isFallback = false;

    try {
        // Try fetching the full CSV file
        const response = await fetch('GRETL_TUFE.csv');
        if (response.ok) {
            csvText = await response.text();
        } else {
             throw new Error('CSV file not found');
        }
    } catch (error) {
        console.warn("Could not load full CSV data, using fallback dataset.", error);
        csvText = FALLBACK_CSV;
        isFallback = true;
    }

    const rawCpiData = parseCSV(csvText);
    const fxMap = generateFXRates(2015, 2026);

    const marketData: MarketDataPoint[] = rawCpiData.map((row: any) => {
        const date = row.date;
        if(!date) return null;
        
        const monthKey = date.substring(0, 7); 
        const rates = fxMap[monthKey] || fxMap['2025-01']; // Default to recent rate if out of bounds
        
        return {
            ...row,
            _rates: rates
        };
    }).filter((row): row is MarketDataPoint => row !== null && row.timestamp !== undefined)
    .sort((a, b) => a.timestamp - b.timestamp);

    const items = Object.keys(rawCpiData[0] || {})
        .filter(key => key !== 'date' && key !== 'timestamp' && key !== 'Tarih' && key !== '_rates');

    return { data: marketData, items, isFallback };
};

const parseCSV = (csv: string): any[] => {
  const lines = csv.replace(/\r/g, '').trim().split('\n');
  if (lines.length < 2) return [];

  // Robust Header Parsing
  const headerLine = lines[0];
  // Regex to split by comma ONLY if not inside quotes
  const headers = headerLine.match(/(?:\"([^\"]*)\")|([^,]+)/g)?.map(h => h.replace(/^"|"$/g, '').trim()) || [];
  
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Robust Value Parsing (handles quoted commas)
    const valuesMatch = line.match(/(?:\"([^\"]*)\")|([^,]+)/g);
    if (!valuesMatch) continue;
    
    const values = valuesMatch.map(v => v.replace(/^"|"$/g, '').trim());

    const row: any = {};
    headers.forEach((header, index) => {
      let val = values[index] || '';
      
      if (header === 'Tarih' || header === 'Date') {
         if (val) {
             // Try to handle DD/MM/YYYY or YYYY-MM-DD
             if (val.includes('/')) {
                 const parts = val.split('/');
                 if(parts.length === 3) {
                     // Assume DD/MM/YYYY for this dataset based on example
                     // But verify year length
                     if (parts[2].length === 4) {
                         row['date'] = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
                     } else {
                         row['date'] = val; // unknown format
                     }
                 }
             } else {
                 row['date'] = val;
             }
             
             if(row['date']) {
                 row['timestamp'] = new Date(row['date']).getTime();
             }
         }
      } else {
        const num = parseFloat(val);
        row[header] = isNaN(num) ? null : num;
      }
    });
    
    if (row['date']) {
        data.push(row);
    }
  }
  return data;
};
