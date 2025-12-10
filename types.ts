export interface MarketDataPoint {
  date: string; // ISO format YYYY-MM-DD
  timestamp: number;
  [key: string]: number | string;
}

export interface ExchangeRates {
  [date: string]: {
    USD: number;
    EUR: number;
    GBP: number;
    BRENT_TL: number;
    BRENT_USD: number;
  };
}

export enum Currency {
  TRY = 'TRY',
  USD = 'USD',
  EUR = 'EUR',
  BRENT = 'BRENT'
}

export enum ScaleType {
  LINEAR = 'Lineer',
  LOG = 'Logaritmik',
  PERCENTAGE = '%'
}

export interface SeriesConfig {
  id: string;
  name: string;
  color: string;
}