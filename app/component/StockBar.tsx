'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface StockData {
  [key: string]: number;
}

const STOCK_LABELS = [
  { key: 'N সাদা-৩৮', label: 'N সাদা-৩৮', type: 'white' },
  { key: 'N সাদা-৪০', label: 'N সাদা-৪০', type: 'white' },
  { key: 'N সাদা-৪২', label: 'N সাদা-৪২', type: 'white' },
  { key: 'N সাদা-৪৪', label: 'N সাদা-৪৪', type: 'white' },
  { key: 'N কালো-৩৮', label: 'N কালো-৩৮', type: 'black' },
  { key: 'N কালো-৪০', label: 'N কালো-৪০', type: 'black' },
  { key: 'N কালো-৪২', label: 'N কালো-৪২', type: 'black' },
  { key: 'N কালো-৪৪', label: 'N কালো-৪৪', type: 'black' },
  { key: 'D সাদা-৩৮', label: 'D সাদা-৩৮', type: 'white' },
  { key: 'D সাদা-৪০', label: 'D সাদা-৪০', type: 'white' },
  { key: 'D সাদা-৪২', label: 'D সাদা-৪২', type: 'white' },
  { key: 'D সাদা-৪৪', label: 'D সাদা-৪৪', type: 'white' },
  { key: 'D কালো-৩৮', label: 'D কালো-৩৮', type: 'black' },
  { key: 'D কালো-৪০', label: 'D কালো-৪০', type: 'black' },
  { key: 'D কালো-৪২', label: 'D কালো-৪২', type: 'black' },
  { key: 'D কালো-৪৪', label: 'D কালো-৪৪', type: 'black' },
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
    fetchLiveStock(); // প্রথমবার লোড হবে[cite: 12]
    const interval = setInterval(fetchLiveStock, 15000); // প্রতি ১৫ সেকেন্ডে লাইভ আপডেট[cite: 12]
    window.addEventListener('stockUpdated', fetchLiveStock); // পারচেজ অ্যাড/ডিলিট করলে সাথে সাথে আপডেট[cite: 12]

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
            const isLowStock = currentStock <= 20;
            const backgroundStyle = isLowStock
              ? 'bg-rose-950/90 border-rose-600 shadow-rose-900/50 shadow-inner animate-pulse'
              : item.type === 'white'
              ? 'bg-slate-800/90 border-slate-600 text-slate-100'
              : 'bg-slate-950 border-slate-850 text-slate-300';
            return (
              <div key={item.key} className={`flex flex-col rounded border p-1 text-center transition-all ${backgroundStyle}`}>
                <div className="text-[10px] font-black truncate py-0.5 border-b border-slate-700/50" title={item.label}>
                  {item.label}
                </div>
                <div className="flex items-center justify-center gap-1 py-1">
                  <span className={`text-xs font-black ${isLowStock ? 'text-rose-400 font-extrabold' : 'text-emerald-400'}`}>
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