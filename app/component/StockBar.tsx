'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Check, AlertTriangle } from 'lucide-react';

interface StockData {
  [key: string]: number;
}

const STOCK_LABELS = [
  // ১-৪: ন্যারো সাদা (৩৮, ৪০, ৪২, ৪৪)
  { key: 'n_white_38', label: 'N সাদা-৩৮', type: 'white' },
  { key: 'n_white_40', label: 'N সাদা-৪০', type: 'white' },
  { key: 'n_white_42', label: 'N সাদা-৪২', type: 'white' },
  { key: 'n_white_44', label: 'N সাদা-৪৪', type: 'white' },
  // ৫-৮: ন্যারো কালো (৩৮, ৪০, ৪২, ৪৪)
  { key: 'n_black_38', label: 'N কালো-৩৮', type: 'black' },
  { key: 'n_black_40', label: 'N কালো-৪০', type: 'black' },
  { key: 'n_black_42', label: 'N কালো-৪২', type: 'black' },
  { key: 'n_black_44', label: 'N কালো-৪৪', type: 'black' },
  // ৯-১২: ঢোলা সাদা (৩৮, ৪০, ৪২, ৪৪)
  { key: 'd_white_38', label: 'D সাদা-৩৮', type: 'white' },
  { key: 'd_white_40', label: 'D সাদা-৪০', type: 'white' },
  { key: 'd_white_42', label: 'D সাদা-৪২', type: 'white' },
  { key: 'd_white_44', label: 'D সাদা-৪৪', type: 'white' },
  // ১৩-১৬: ঢোলা কালো (৩৮, ৪০, ৪২, ৪৪)
  { key: 'd_black_38', label: 'D কালো-৩৮', type: 'black' },
  { key: 'd_black_40', label: 'D কালো-৪০', type: 'black' },
  { key: 'd_black_42', label: 'D কালো-৪২', type: 'black' },
  { key: 'd_black_44', label: 'D কালো-৪৪', type: 'black' },
];

export default function StockBar() {
  const [stock, setStock] = useState<StockData>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  useEffect(() => {
    fetch('/data/stock.json')
      .then((res) => res.json())
      .then((data) => setStock(data))
      .catch(() => {});
  }, []);

  const handleSave = (key: string) => {
    const updated = { ...stock, [key]: Number(tempValue) || 0 };
    setStock(updated);
    setEditingKey(null);
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl p-2.5 mb-3 shadow-md border border-slate-800">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          লাইভ ইনভেন্টরি স্টক বার (N ও D ১৬ ভ্যারিয়েশন)
        </h2>
      </div>

      <div className="overflow-x-auto pb-1 custom-top-scrollbar">
        <div className="grid grid-cols-16 gap-1 min-w-[1350px]">
          {STOCK_LABELS.map((item) => {
            const currentStock = stock[item.key] ?? 0;
            const isLowStock = currentStock <= 20;
            const isEditing = editingKey === item.key;

            const backgroundStyle = isLowStock
              ? 'bg-rose-950/90 border-rose-600 shadow-rose-900/50 shadow-inner animate-pulse text-white'
              : item.type === 'white'
              ? 'bg-slate-800/90 border-slate-600 text-slate-100 hover:bg-slate-750'
              : 'bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900';

            return (
              <div
                key={item.key}
                className={`flex flex-col rounded border p-1 text-center transition-all ${backgroundStyle}`}
              >
                <div className="text-[10px] font-black truncate py-0.5 border-b border-slate-700/50" title={item.label}>
                  {item.label}
                </div>

                <div className="flex items-center justify-center gap-1 py-1">
                  {isEditing ? (
                    <div className="flex items-center gap-0.5">
                      <input
                        type="number"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="w-10 text-center text-xs font-black text-slate-950 bg-white rounded outline-none"
                        autoFocus
                      />
                      <button onClick={() => handleSave(item.key)} className="text-emerald-400 hover:text-emerald-300">
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setEditingKey(item.key);
                        setTempValue(String(currentStock));
                      }}
                      className="cursor-pointer flex items-center gap-1 group"
                      title="ক্লিক করে স্টক এডিট করুন"
                    >
                      <span className={`text-xs font-black ${isLowStock ? 'text-rose-400 font-extrabold' : 'text-emerald-400'}`}>
                        {currentStock}
                      </span>
                      <Edit2 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  )}
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