'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface StockData {
  [key: string]: number;
}

const STOCK_LABELS = [
  { key: 'N-White-38', label: 'N-White-38', type: 'white' },
  { key: 'N-White-40', label: 'N-White-40', type: 'white' },
  { key: 'N-White-42', label: 'N-White-42', type: 'white' },
  { key: 'N-White-44', label: 'N-White-44', type: 'white' },
  { key: 'N-Black-38', label: 'N-Black-38', type: 'black' },
  { key: 'N-Black-40', label: 'N-Black-40', type: 'black' },
  { key: 'N-Black-42', label: 'N-Black-42', type: 'black' },
  { key: 'N-Black-44', label: 'N-Black-44', type: 'black' },
  { key: 'D-White-38', label: 'D-White-38', type: 'white' },
  { key: 'D-White-40', label: 'D-White-40', type: 'white' },
  { key: 'D-White-42', label: 'D-White-42', type: 'white' },
  { key: 'D-White-44', label: 'D-White-44', type: 'white' },
  { key: 'D-Black-38', label: 'D-Black-38', type: 'black' },
  { key: 'D-Black-40', label: 'D-Black-40', type: 'black' },
  { key: 'D-Black-42', label: 'D-Black-42', type: 'black' },
  { key: 'D-Black-44', label: 'D-Black-44', type: 'black' },
];

export default function StockBar() {
  const [stock, setStock] = useState<StockData>({});
  const [loading, setLoading] = useState(true);

  const fetchLiveStock = () => {
    fetch('/api/stock/live')
      .then((res) => res.json())
      .then((data) => {
        setStock(data || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLiveStock();
    const interval = setInterval(fetchLiveStock, 15000);
    window.addEventListener('stockUpdated', fetchLiveStock);

    return () => {
      clearInterval(interval);
      window.removeEventListener('stockUpdated', fetchLiveStock);
    };
  }, []);

  return (
    <div className="bg-slate-900 text-white rounded-xl p-2.5 mb-3 shadow-md border border-slate-800">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          লাইভ ইনভেন্টরি স্টক বার (ক্যালকুলেটেড)
        </h2>
        {loading && <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
      </div>
      <div className="overflow-x-auto pb-1 custom-top-scrollbar">
        <div className="grid grid-cols-16 gap-1 min-w-[1350px]">
          {STOCK_LABELS.map((item) => {
            const currentStock = stock[item.key] ?? 0;
            const isLowStock = currentStock <= 10;
            const isCritical = currentStock < 5;

            const backgroundStyle = isCritical
              ? 'bg-red-950/95 border-red-500 shadow-red-900/90 shadow-inner ring-2 ring-red-500 animate-pulse relative'
              : isLowStock
              ? 'bg-rose-950/90 border-rose-600 shadow-rose-900/50 shadow-inner'
              : item.type === 'white'
              ? 'bg-slate-800/90 border-slate-600 text-slate-200'
              : 'bg-slate-950 border-slate-850 text-slate-300';

            return (
              <div key={item.key} className={`flex flex-col rounded border p-1 text-center transition-all ${backgroundStyle}`}>
                {isCritical && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" title="ক্রিটিক্যাল স্টক (<5)"></span>
                )}
                <div className="text-[10px] font-bold truncate py-0.5 border-b border-slate-700/50 text-slate-300" title={item.label}>
                  {item.label}
                </div>
                <div className="flex items-center justify-center gap-1 py-1">
                  <span className={`text-xs font-black ${isCritical ? 'text-red-400 font-extrabold' : isLowStock ? 'text-rose-400 font-extrabold' : 'text-emerald-400'}`}>
                    {currentStock}
                  </span>
                  {isLowStock && <AlertTriangle className="w-2.5 h-2.5 text-rose-500 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}