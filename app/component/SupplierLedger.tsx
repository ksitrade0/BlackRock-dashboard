'use client';

import React, { useState } from 'react';
import { Users, ShoppingBag, Plus, DollarSign, FileText } from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  phone: string;
  materials: string;
  dueAmount: number;
}

export default function SupplierLedger() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: 1, name: 'রহিম ভাই (ফেব্রিক সাপ্লায়ার)', phone: '01700000000', materials: 'China Micro Stitch', dueAmount: 15000 },
    { id: 2, name: 'করিম ভাই (কাটিং ও সুইং)', phone: '01800000000', materials: 'পাজামা স্টিচিং', dueAmount: 8500 },
  ]);

  const [newSupplierName, setNewSupplierName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newMaterial, setNewMaterial] = useState('');

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName) return;

    const newSup: Supplier = {
      id: Date.now(),
      name: newSupplierName,
      phone: newPhone || 'N/A',
      materials: newMaterial || 'পাজামা ম্যাটেরিয়াল',
      dueAmount: 0,
    };

    setSuppliers([...suppliers, newSup]);
    setNewSupplierName('');
    setNewPhone('');
    setNewMaterial('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-300 p-4 mt-6">
      <div className="flex flex-col md:flex-row items-center justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase text-slate-900 tracking-wide">সাপ্লায়ার ও পার্টি লেজার ম্যানেজমেন্ট</h2>
            <p className="text-xs text-slate-500 font-medium">কাঁচামাল ক্রয়, খরচ, বকেয়া হিসাব এবং ম্যানুয়াল ইনভেন্টরি আপডেট</p>
          </div>
        </div>
      </div>

      {/* নতুন সাপ্লায়ার যোগ করার ফর্ম */}
      <form onSubmit={handleAddSupplier} className="grid grid-cols-1 md:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
        <input
          type="text"
          placeholder="সাপ্লায়ার বা পার্টির নাম..."
          value={newSupplierName}
          onChange={(e) => setNewSupplierName(e.target.value)}
          className="bg-white border border-slate-300 rounded px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-900"
        />
        <input
          type="text"
          placeholder="মোবাইল নম্বর..."
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          className="bg-white border border-slate-300 rounded px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-900"
        />
        <input
          type="text"
          placeholder="ম্যাটেরিয়াল বা কাজের বিবরণ..."
          value={newMaterial}
          onChange={(e) => setNewMaterial(e.target.value)}
          className="bg-white border border-slate-300 rounded px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-900"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1 bg-slate-900 hover:bg-black text-white text-xs font-bold py-2 rounded transition cursor-pointer shadow-2xs"
        >
          <Plus className="w-4 h-4 text-amber-400" /> নতুন পার্টি যোগ করুন
        </button>
      </form>

      {/* সাপ্লায়ার তালিকা টেবিল */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
              <th className="p-3">সাপ্লায়ার / পার্টির নাম</th>
              <th className="p-3">মোবাইল নম্বর</th>
              <th className="p-3">সরবরাহকৃত আইটেম / ম্যাটেরিয়াল</th>
              <th className="p-3 text-right">বর্তমান বকেয়া (৳)</th>
              <th className="p-3 text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((sup) => (
              <tr key={sup.id} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="p-3 font-black text-slate-900">{sup.name}</td>
                <td className="p-3 font-mono font-bold text-slate-700">{sup.phone}</td>
                <td className="p-3 font-semibold text-slate-800">{sup.materials}</td>
                <td className="p-3 font-black text-right text-rose-700">৳ {sup.dueAmount.toLocaleString()}</td>
                <td className="p-3 text-center">
                  <button className="px-3 py-1 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded shadow-2xs cursor-pointer">
                    লেনদেন দেখুন
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}