import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
        </div>
        <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">KKTC TÜFE Analizi</h1>
            <p className="text-xs text-slate-400">Tarihsel Fiyat ve Döviz Analizi (2015-2025)</p>
        </div>
      </div>
    </header>
  );
};

export default Header;