'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Package, FileText, X, Save, ShoppingCart, Printer, Plus, Trash2, UserCircle, CheckSquare, Square, ArrowDownLeft, ArrowUpRight, RotateCcw, Wallet, Calendar, UserPlus, Filter } from 'lucide-react';

const STAFF_MEMBERS = ['Awlad Hossain', 'Emdadullah Sakib', 'Omar Faruque'];

export default function AdminInventoryPanel({ existingItems }: { existingItems: string[] }) {
  const [mounted, setMounted] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState('Admin');
  
  const [authTarget, setAuthTarget] = useState<'inventory' | 'expense' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [activePanel, setActivePanel] = useState<'inventory' | 'expense' | null>(null);
  const [invTab, setInvTab] = useState<'entry' | 'statement'>('entry');

  const [statementData, setStatementData] = useState<any[]>([]);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  
  const [entryType, setEntryType] = useState<'NEW' | 'RETURN'>('NEW');
  const [returnInvoice, setReturnInvoice] = useState('');
  const [partyName, setPartyName] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([{ itemName: '', quantity: 1, buyingPrice: 0 }]);
  const [isSaving, setIsSaving] = useState(false);

  // Expense States
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [expSpender, setExpSpender] = useState('');
  const [expCustomSpender, setExpCustomSpender] = useState('');
  const [expDate, setExpDate] = useState('');
  const [expenseItems, setExpenseItems] = useState([{ description: '', amount: '' }]);
  const [expFilter, setExpFilter] = useState('all');

  // Print Modal States
  const [printModalTarget, setPrintModalTarget] = useState<'stock' | 'expense' | null>(null);
  const [printPeriod, setPrintPeriod] = useState('all'); // all, daily, weekly, monthly, yearly
  const [printDateVal, setPrintDateVal] = useState('');
  const [printMonthVal, setPrintMonthVal] = useState('');
  const [printYearVal, setPrintYearVal] = useState(new Date().getFullYear().toString());

  useEffect(() => { 
    setMounted(true); 
    setExpDate(new Date().toISOString().split('T')[0]);
    // 🚀 অটোমেটিক লগইন ইউজার ফেচ করা (page.tsx এ হাত না দিয়েই)
    fetch('/api/auth/check').then(res => res.json()).then(d => {
      if(d.username) { setLoggedInUser(d.username); setExpSpender(d.username); }
    }).catch(()=>{});
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (res.ok && data.success) {
        setActivePanel(authTarget); setAuthTarget(null); setPassword('');
        if (authTarget === 'inventory') fetchStatement();
        if (authTarget === 'expense') fetchExpenses();
      } else { alert('❌ ভুল জিমেইল বা পাসওয়ার্ড!'); setPassword(''); }
    } catch (err) { alert('সার্ভার সমস্যা!'); } finally { setIsVerifying(false); }
  };

  const closePanel = () => { setActivePanel(null); setPartyName(''); setReturnInvoice(''); setPurchaseItems([{ itemName: '', quantity: 1, buyingPrice: 0 }]); setExpenseItems([{ description: '', amount: '' }]); };

  // =================== INVENTORY LOGIC ===================
  const fetchStatement = async () => {
    setIsLoadingStatement(true);
    try {
      const res = await fetch('/api/stock/statement'); const data = await res.json();
      setStatementData(data.data || []); setSelectedRowIds((data.data || []).map((r: any) => r.id));
    } catch (err) { setStatementData([]); } finally { setIsLoadingStatement(false); }
  };

  const handleItemChange = (index: number, field: string, value: any) => { const updated = [...purchaseItems]; (updated[index] as any)[field] = value; setPurchaseItems(updated); };
  const handleRemoveItemRow = (index: number) => { const updated = purchaseItems.filter((_, i) => i !== index); setPurchaseItems(updated.length > 0 ? updated : [{ itemName: '', quantity: 1, buyingPrice: 0 }]); };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    const finalParty = entryType === 'RETURN' ? `রিটার্ন পার্সেল: ${returnInvoice}` : partyName;
    try {
      const res = await fetch('/api/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partyName: finalParty, items: purchaseItems, createdBy: loggedInUser, entryType }) });
      const result = await res.json();
      if (res.ok && result.success) {
        alert('✅ সফলভাবে স্টক ইনভেন্টরি যুক্ত হয়েছে!'); setPartyName(''); setReturnInvoice(''); setPurchaseItems([{ itemName: '', quantity: 1, buyingPrice: 0 }]);
        fetchStatement(); window.dispatchEvent(new Event('stockUpdated'));
      } else alert('❌ ডেটাবেজ সেভ হতে সমস্যা হয়েছে!');
    } catch (err) { alert('❌ নেটওয়ার্ক এরর!'); } finally { setIsSaving(false); }
  };

  const handleDeleteStatementRow = async (row: any) => {
    if (!confirm('সতর্কবার্তা! আপনি কি এই রেকর্ডটি মুছে ফেলতে চান?')) return;
    const realId = row.id.replace(/^(pur-|out-|res-)/, '');
    try {
      await fetch(`/api/purchases/${realId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deletedBy: loggedInUser, rowType: row.type, rawId: row.id }) });
      fetchStatement(); window.dispatchEvent(new Event('stockUpdated'));
    } catch (err) { alert('❌ সার্ভার সমস্যা!'); }
  };

  // 🚀 স্টক স্টেটমেন্ট গ্রুপিং (একই রেফারেন্সে আইটেম স্লাশ দিয়ে অ্যাড করা)
  const groupedStatement = useMemo(() => {
    const filtered = statementData.filter(row => selectedTypeFilter === 'all' || row.type === selectedTypeFilter);
    const groups: any[] = []; const map = new Map();
    filtered.forEach(row => {
      const key = (row.reference && row.reference.trim() !== '' && !row.reference.includes('রিটার্ন')) ? `${row.reference}-${row.type}-${row.date?.split('T')[0]}` : row.id;
      if (map.has(key)) {
        const ext = map.get(key);
        if(!ext.itemNames.includes(row.itemName)) ext.itemNames.push(row.itemName);
        ext.quantity += Number(row.quantity); ext.total += Number(row.total); ext.rawIds.push(row.id);
      } else { map.set(key, { ...row, itemNames: [row.itemName], quantity: Number(row.quantity), total: Number(row.total), rawIds: [row.id] }); }
    });
    map.forEach(val => { val.itemName = val.itemNames.join(' / '); groups.push(val); });
    return groups;
  }, [statementData, selectedTypeFilter]);

  // =================== EXPENSE LOGIC ===================
  const fetchExpenses = async () => {
    setIsLoadingStatement(true);
    try { const res = await fetch('/api/expenses'); const data = await res.json(); setExpensesData(data.data || []); } 
    catch (err) { setExpensesData([]); } finally { setIsLoadingStatement(false); }
  };

  const handleExpItemChange = (index: number, field: string, value: any) => { const updated = [...expenseItems]; (updated[index] as any)[field] = value; setExpenseItems(updated); };
  const removeExpItem = (index: number) => { const updated = expenseItems.filter((_, i) => i !== index); setExpenseItems(updated.length > 0 ? updated : [{ description: '', amount: '' }]); };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSpender = expSpender === 'add_new' ? expCustomSpender : expSpender;
    if (!finalSpender || expenseItems.some(i => !i.description || !i.amount)) return alert('অনুগ্রহ করে সব তথ্য দিন।');
    setIsSaving(true);
    try {
      const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: expDate, spender: finalSpender, createdBy: loggedInUser, items: expenseItems }) });
      if (res.ok) {
        alert('✅ খরচের হিসাব সেভ হয়েছে!'); setExpenseItems([{ description: '', amount: '' }]); setExpCustomSpender(''); fetchExpenses();
      } else alert('❌ সেভ হতে সমস্যা হয়েছে!');
    } catch (err) { alert('❌ নেটওয়ার্ক এরর!'); } finally { setIsSaving(false); }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('খরচের এই এন্ট্রিটি মুছে ফেলতে চান?')) return;
    try { await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' }); fetchExpenses(); } catch (err) {}
  };

  const filteredExpenses = expensesData.filter(row => {
    if (expFilter === 'all') return true;
    const rowD = new Date(row.date); const now = new Date();
    if (expFilter === 'today') return rowD.toDateString() === now.toDateString();
    if (expFilter === 'month') return rowD.getMonth() === now.getMonth() && rowD.getFullYear() === now.getFullYear();
    if (expFilter === 'year') return rowD.getFullYear() === now.getFullYear();
    return true;
  });
  const totalExpense = filteredExpenses.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  // =================== UTILS & PRINT ===================
  const getWeekNumber = (d: Date) => { const d2 = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const dayNum = d2.getUTCDay() || 7; d2.setUTCDate(d2.getUTCDate() + 4 - dayNum); const yearStart = new Date(Date.UTC(d2.getUTCFullYear(), 0, 1)); return Math.ceil((((d2.getTime() - yearStart.getTime()) / 86400000) + 1) / 7); };
  const formatWeek = (dateStr: string) => { if(!dateStr) return 'N/A'; const d = new Date(dateStr); return `Week ${getWeekNumber(d)} (${d.toLocaleString('en-GB', { month: 'short' })})`; };

  const triggerPrint = () => {
    const elementId = printModalTarget === 'stock' ? 'print-statement' : 'print-expenses';
    const printContent = document.getElementById(elementId);
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<html><head><title>Print Report</title><style>body{font-family:sans-serif;padding:20px} table{width:100%;border-collapse:collapse;margin-top:15px} th,td{border:1px solid #333;padding:8px;font-size:12px} th{background:#f1f5f9;text-align:left}</style></head><body>${printContent.outerHTML}<script>setTimeout(()=>{window.print();window.close();},500);</script></body></html>`);
      printWindow.document.close();
    } else alert('পপ-আপ ব্লকার চালু আছে!');
    setPrintModalTarget(null);
  };

  const getFilteredPrintData = (dataArray: any[]) => {
    if (printPeriod === 'all') return dataArray;
    return dataArray.filter(row => {
      const rowD = new Date(row.date);
      if (printPeriod === 'daily') return row.date.startsWith(printDateVal);
      if (printPeriod === 'monthly') return row.date.startsWith(printMonthVal);
      if (printPeriod === 'yearly') return rowD.getFullYear().toString() === printYearVal;
      return true;
    });
  };

  const finalPrintStock = printModalTarget === 'stock' ? getFilteredPrintData(groupedStatement) : [];
  const finalPrintExpense = printModalTarget === 'expense' ? getFilteredPrintData(filteredExpenses) : [];
  const finalPrintTotalStock = finalPrintStock.reduce((sum, row) => sum + Number(row.total || 0), 0);
  const finalPrintTotalExp = finalPrintExpense.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-1.5 w-48">
      {/* 🚀 Swadhinota Font Style Injection */}
      <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Tiro+Bangla:ital@0;1&display=swap'); .swadhinota-font { font-family: 'Swadhinota', 'Tiro Bangla', sans-serif; letter-spacing: 0.5px; }`}} />

      <button onClick={() => setAuthTarget('inventory')} className="w-full h-[36px] flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition shadow-2xs border border-slate-800 cursor-pointer">
        <Package className="w-3.5 h-3.5 text-amber-400" /> ইনভেন্টরি ও স্টক লেজার
      </button>
      <button onClick={() => setAuthTarget('expense')} className="w-full h-[36px] flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-bold transition shadow-2xs border border-slate-300 cursor-pointer">
        <Wallet className="w-3.5 h-3.5 text-rose-600" /> কোম্পানির খরচের হিসাব
      </button>

      {/* 🚀 Premium Auth Modal */}
      {authTarget && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4">
          <form onSubmit={handleAuth} className="bg-white/90 p-10 rounded-[32px] w-full max-w-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-white/50 animate-in fade-in zoom-in-90 swadhinota-font">
            <div className="flex flex-col items-center mb-8">
              <div className="bg-gradient-to-tr from-rose-500 to-orange-400 p-4 rounded-2xl mb-4 shadow-lg shadow-rose-500/30"><Lock className="w-8 h-8 text-white" /></div>
              <h3 className="text-2xl font-bold text-slate-900">অ্যাডমিন আনলক</h3>
              <p className="text-sm font-bold text-slate-500 mt-2 text-center">নিরাপদ ড্যাশবোর্ড অ্যাক্সেস করতে লগইন করুন</p>
            </div>
            <div className="space-y-4">
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Email / ID" className="w-full bg-white border border-slate-200 p-4 rounded-2xl font-bold text-base focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition shadow-inner" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-white border border-slate-200 p-4 rounded-2xl font-bold text-base tracking-widest focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition shadow-inner" required />
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setAuthTarget(null)} className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition cursor-pointer">বাতিল করুন</button>
              <button type="submit" disabled={isVerifying} className="w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold rounded-2xl hover:shadow-xl transition flex justify-center cursor-pointer">{isVerifying ? 'যাচাই হচ্ছে...' : 'লগইন করুন'}</button>
            </div>
          </form>
        </div>, document.body
      )}

      {/* 🚀 Advanced Print Modal */}
      {printModalTarget && createPortal(
        <div className="fixed inset-0 z-[9999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2"><Filter className="w-5 h-5 text-indigo-600"/> প্রিন্ট অপশন</h3>
            <p className="text-xs font-bold text-slate-500 mb-6">আপনি কোন সময়ের রিপোর্ট প্রিন্ট করতে চান তা সিলেক্ট করুন।</p>
            
            <div className="space-y-4 mb-6">
              <select value={printPeriod} onChange={e=>setPrintPeriod(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl font-bold text-sm bg-slate-50 outline-none">
                <option value="all">সব রেকর্ড প্রিন্ট করুন</option>
                <option value="daily">নির্দিষ্ট দিনের হিসাব</option>
                <option value="monthly">নির্দিষ্ট মাসের হিসাব</option>
                <option value="yearly">নির্দিষ্ট বছরের হিসাব</option>
              </select>
              
              {printPeriod === 'daily' && <input type="date" value={printDateVal} onChange={e=>setPrintDateVal(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl font-bold" />}
              {printPeriod === 'monthly' && <input type="month" value={printMonthVal} onChange={e=>setPrintMonthVal(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl font-bold" />}
              {printPeriod === 'yearly' && <select value={printYearVal} onChange={e=>setPrintYearVal(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl font-bold"><option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option></select>}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPrintModalTarget(null)} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer">বাতিল</button>
              <button onClick={triggerPrint} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg flex justify-center gap-2 cursor-pointer"><Printer className="w-4 h-4"/> প্রিন্ট করুন</button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* INVENTORY PANEL */}
      {activePanel === 'inventory' && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-100 flex flex-col w-screen h-screen">
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-xs">
            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button onClick={() => setInvTab('entry')} className={`px-5 py-2 rounded-lg text-sm font-black transition cursor-pointer flex items-center gap-2 ${invTab === 'entry' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}><ShoppingCart className="w-4 h-4"/> পারচেজ ও এন্ট্রি</button>
              <button onClick={() => { setInvTab('statement'); fetchStatement(); }} className={`px-5 py-2 rounded-lg text-sm font-black transition cursor-pointer flex items-center gap-2 ${invTab === 'statement' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}><FileText className="w-4 h-4"/> স্টক স্টেটমেন্ট ও লেজার</button>
            </div>
            <button onClick={closePanel} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-transparent"><X className="w-6 h-6" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {invTab === 'entry' ? (
              <form onSubmit={handleSavePurchase} className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1">এন্ট্রির ধরণ</label>
                    <select value={entryType} onChange={(e) => setEntryType(e.target.value as 'NEW'|'RETURN')} className="w-full border border-slate-300 p-3 rounded-xl font-bold text-sm bg-slate-50 outline-none cursor-pointer">
                      <option value="NEW">🟢 নতুন মাল (Fresh Stock)</option><option value="RETURN">🔴 রিটার্ন মাল (Returned Stock)</option>
                    </select>
                  </div>
                  <div>
                    {entryType === 'RETURN' ? (
                      <><label className="block text-xs font-black text-rose-600 mb-1">অর্ডার ইনভয়েস বা CID নম্বর</label><input type="text" value={returnInvoice} onChange={(e) => setReturnInvoice(e.target.value)} placeholder="যেমন: 30061..." className="w-full border border-rose-300 p-3 rounded-xl font-bold text-sm bg-rose-50 outline-none" required /></>
                    ) : (
                      <><label className="block text-xs font-black text-slate-600 mb-1">সাপ্লায়ার বা পার্টির নাম</label><input type="text" value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="যেমন: রহিম ভাই..." className="w-full border border-slate-300 p-3 rounded-xl font-bold text-sm bg-slate-50 outline-none" required /></>
                    )}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                  <div className="grid grid-cols-12 gap-3 p-3 bg-slate-100 text-[11px] font-black text-slate-600 uppercase text-center border-b border-slate-200"><div className="col-span-5 text-left pl-2">আইটেম</div><div className="col-span-3">পরিমাণ</div><div className="col-span-3">কেনা দাম</div><div className="col-span-1">বাদ</div></div>
                  <div className="p-3 space-y-3">
                    {purchaseItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 items-center">
                        <select value={item.itemName} onChange={(e) => handleItemChange(index, 'itemName', e.target.value)} className="col-span-5 border border-slate-300 p-2.5 rounded-lg text-xs font-bold outline-none cursor-pointer" required><option value="">-- আইটেম --</option>{existingItems.map(p => <option key={p} value={p}>{p}</option>)}</select>
                        <input type="number" value={item.quantity || ''} onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} placeholder="পিস" className="col-span-3 border border-slate-300 p-2.5 rounded-lg text-center text-xs font-bold outline-none" required />
                        <input type="number" value={item.buyingPrice || ''} onChange={(e) => handleItemChange(index, 'buyingPrice', Number(e.target.value))} placeholder="৳" className="col-span-3 border border-slate-300 p-2.5 rounded-lg text-center text-xs font-bold outline-none" required />
                        <button type="button" onClick={() => handleRemoveItemRow(index)} className="col-span-1 p-2 text-rose-500 hover:bg-rose-50 rounded flex justify-center cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setPurchaseItems([...purchaseItems, { itemName: '', quantity: 1, buyingPrice: 0 }])} className="w-full py-2.5 bg-slate-50 border-2 border-dashed border-slate-300 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-100 flex justify-center gap-1 cursor-pointer"><Plus className="w-4 h-4"/> আরও আইটেম</button>
                  </div>
                </div>
                <button type="submit" disabled={isSaving} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-sm hover:bg-black transition cursor-pointer">{isSaving ? 'সেভ হচ্ছে...' : 'এন্ট্রি সেভ করুন'}</button>
              </form>
            ) : (
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between mb-4 no-print">
                  <select value={selectedTypeFilter} onChange={(e) => setSelectedTypeFilter(e.target.value)} className="border border-slate-300 px-3 py-2 rounded-lg text-xs font-black bg-white outline-none cursor-pointer">
                    <option value="all">সকল ট্রানজেকশন</option><option value="STOCK_IN">🟢 স্টক ইন</option><option value="STOCK_OUT">🔴 স্টক আউট</option><option value="RESTORED">🔵 স্টক রিস্টোর</option>
                  </select>
                  <button onClick={() => setPrintModalTarget('stock')} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Printer className="w-4 h-4"/> প্রিন্ট করুন</button>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                      <tr><th className="px-5 py-3">তারিখ ও সময়</th><th className="px-5 py-3">সপ্তাহ/মাস</th><th className="px-5 py-3">ধরণ</th><th className="px-5 py-3">পার্টি/রেফারেন্স</th><th className="px-5 py-3">আইটেম (স্লাশ গ্রুপড)</th><th className="px-5 py-3 text-center">পরিমাণ</th><th className="px-5 py-3 text-right">মোট (৳)</th><th className="px-5 py-3 text-center">অ্যাকশন</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupedStatement.map((row, idx) => {
                        const currentDate = row.date ? new Date(row.date).toLocaleDateString('en-GB') : 'N/A';
                        const prevDate = idx > 0 && groupedStatement[idx - 1].date ? new Date(groupedStatement[idx - 1].date).toLocaleDateString('en-GB') : null;
                        return (
                          <React.Fragment key={row.id}>
                            {currentDate !== prevDate && <tr><td colSpan={8} className="bg-slate-800 text-amber-400 font-black text-xs text-center py-2 border-y-4 border-slate-950">📅 {currentDate} এর ট্রানজেকশন</td></tr>}
                            <tr className="hover:bg-slate-50">
                              <td className="px-5 py-3 text-xs font-bold text-slate-600"><div>{row.date ? new Date(row.date).toLocaleString('en-GB') : 'N/A'}</div>{row.createdBy && <div className="text-[10px] text-blue-600 font-black mt-1">👤 {row.createdBy}</div>}</td>
                              <td className="px-5 py-3 text-[11px] font-black text-slate-500">{formatWeek(row.date)}</td>
                              <td className="px-5 py-3 text-[11px] font-black">{row.type === 'STOCK_IN' ? '🟢 IN' : row.type === 'STOCK_OUT' ? '🔴 OUT' : '🔵 RESTORED'}</td>
                              <td className="px-5 py-3 text-xs font-black text-slate-800">{row.reference}</td>
                              <td className="px-5 py-3 text-[11px] font-bold text-slate-700 leading-relaxed bg-slate-50 border-l border-r border-slate-100">{row.itemName}</td>
                              <td className="px-5 py-3 text-center text-xs font-black">{row.type === 'STOCK_OUT' ? `-${row.quantity}` : `+${row.quantity}`}</td>
                              <td className="px-5 py-3 text-right text-xs font-black">৳ {row.total}</td>
                              <td className="px-5 py-3 text-center"><button onClick={() => handleDeleteStatementRow(row)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded cursor-pointer"><Trash2 className="w-4 h-4"/></button></td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div id="print-statement" className="hidden p-6 bg-white text-black swadhinota-font">
                   <h2 className="text-xl font-black text-center border-b-2 border-black pb-2 mb-4">Stock Statement & Ledger</h2>
                   <p className="text-xs font-bold mb-2">Print Filter: {printPeriod.toUpperCase()} | Total Value: ৳ {finalPrintTotalStock}</p>
                   <table className="w-full border-collapse border border-black text-xs">
                     <thead><tr className="bg-gray-100"><th>Date</th><th>Week/Month</th><th>Type</th><th>Reference</th><th>Items</th><th>Qty</th><th>Total</th></tr></thead>
                     <tbody>{finalPrintStock.map(r => <tr key={r.id}><td>{new Date(r.date).toLocaleString('en-GB')}</td><td>{formatWeek(r.date)}</td><td>{r.type}</td><td>{r.reference}</td><td>{r.itemName}</td><td>{r.quantity}</td><td>{r.total}</td></tr>)}</tbody>
                   </table>
                </div>
              </div>
            )}
          </div>
        </div>, document.body
      )}

      {/* EXPENSE PANEL */}
      {activePanel === 'expense' && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-100 flex flex-col w-screen h-screen">
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-xs no-print">
            <div className="flex items-center gap-3"><div className="bg-slate-900 p-2.5 rounded-xl shadow-sm"><Wallet className="w-5 h-5 text-rose-400" /></div><div><h2 className="text-lg font-black uppercase text-slate-900">কোম্পানির খরচের হিসাব</h2></div></div>
            <button onClick={closePanel} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"><X className="w-6 h-6" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex gap-6 max-w-7xl mx-auto w-full items-start no-print">
            {/* 🚀 Multi-row Expense Form */}
            <form onSubmit={handleSaveExpense} className="w-1/3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-6">
              <h3 className="font-black text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2"><Plus className="w-4 h-4"/> নতুন খরচ এন্ট্রি</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">কে খরচা করেছে?</label>
                  <select value={expSpender} onChange={e=>setExpSpender(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg font-bold text-sm outline-none bg-white cursor-pointer">{STAFF_MEMBERS.map(s => <option key={s} value={s}>{s}</option>)}<option value="add_new">+ Add New (নতুন নাম)</option><option value={loggedInUser} className="hidden">{loggedInUser}</option></select>
                </div>
                {expSpender === 'add_new' && <div><input type="text" value={expCustomSpender} onChange={e=>setExpCustomSpender(e.target.value)} placeholder="নতুন নাম লিখুন..." className="w-full border border-rose-300 p-2.5 rounded-lg font-bold text-sm outline-none bg-rose-50" required /></div>}
                <div><label className="block text-xs font-bold text-slate-600 mb-1">তারিখ</label><input type="date" value={expDate} onChange={e=>setExpDate(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg font-bold text-sm outline-none cursor-pointer" required /></div>
                
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
                  <label className="block text-[10px] uppercase tracking-wider font-black text-slate-500 mb-2">খরচের বিবরণ ও পরিমাণ</label>
                  {expenseItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white p-2 border border-slate-200 rounded-lg">
                      <input type="text" value={item.description} onChange={e=>handleExpItemChange(index, 'description', e.target.value)} placeholder="কী খরচ হয়েছে?" className="w-full outline-none text-xs font-bold" required />
                      <input type="number" value={item.amount} onChange={e=>handleExpItemChange(index, 'amount', e.target.value)} placeholder="৳ 500" className="w-24 text-right outline-none text-xs font-black text-rose-600 border-l border-slate-200 pl-2" required />
                      <button type="button" onClick={() => removeExpItem(index)} className="text-rose-400 hover:text-rose-600 pl-1 cursor-pointer"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setExpenseItems([...expenseItems, { description: '', amount: '' }])} className="w-full py-2 bg-white border border-slate-300 text-[11px] font-bold text-slate-600 rounded-lg hover:bg-slate-100 flex justify-center gap-1 cursor-pointer"><Plus className="w-3.5 h-3.5"/> অ্যাড খরচ (+)</button>
                </div>
                
                <button type="submit" disabled={isSaving} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-sm hover:bg-black transition cursor-pointer">{isSaving ? 'সেভ হচ্ছে...' : 'সব খরচ সেভ করুন'}</button>
              </div>
            </form>

            <div className="w-2/3">
              <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <select value={expFilter} onChange={e=>setExpFilter(e.target.value)} className="border-none font-black text-sm outline-none cursor-pointer bg-transparent text-slate-800"><option value="all">সকল খরচের রেকর্ড</option><option value="today">আজকের খরচ</option><option value="month">এই মাসের খরচ</option><option value="year">এই বছরের খরচ</option></select>
                <div className="flex gap-4 items-center">
                  <div className="text-xs font-bold text-slate-500">মোট খরচ: <span className="text-rose-600 font-black text-base">৳ {totalExpense}</span></div>
                  <button onClick={() => setPrintModalTarget('expense')} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Printer className="w-4 h-4"/> প্রিন্ট অপশন</button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200"><tr><th className="px-5 py-3">তারিখ</th><th className="px-5 py-3">বিবরণ</th><th className="px-5 py-3">খরচকারী</th><th className="px-5 py-3 text-right">পরিমাণ</th><th className="px-5 py-3 text-center">অ্যাকশন</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.length===0 ? <tr><td colSpan={5} className="p-10 text-center font-bold text-slate-400">কোনো রেকর্ড নেই</td></tr> :
                     filteredExpenses.map((row, idx) => {
                       const currentDate = new Date(row.date).toLocaleDateString('en-GB'); const prevDate = idx > 0 ? new Date(filteredExpenses[idx - 1].date).toLocaleDateString('en-GB') : null;
                       return (
                         <React.Fragment key={row.id}>
                           {currentDate !== prevDate && <tr><td colSpan={5} className="bg-slate-800 text-rose-400 font-black text-xs text-center py-2 border-y-4 border-slate-950">📅 {currentDate}</td></tr>}
                           <tr className="hover:bg-slate-50">
                             <td className="px-5 py-3 text-xs font-bold text-slate-600">{currentDate} <div className="text-[9px] text-blue-500 mt-0.5">👤 {row.createdBy}</div></td><td className="px-5 py-3 text-xs font-black text-slate-800">{row.description}</td><td className="px-5 py-3 text-xs font-bold text-slate-600 flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5"/>{row.spender}</td><td className="px-5 py-3 text-right text-sm font-black text-rose-600">৳ {row.amount}</td><td className="px-5 py-3 text-center"><button onClick={() => handleDeleteExpense(row.id)} className="text-rose-400 hover:bg-rose-50 p-1.5 rounded cursor-pointer"><Trash2 className="w-4 h-4"/></button></td>
                           </tr>
                         </React.Fragment>
                       )
                     })}
                  </tbody>
                </table>
              </div>
            </div>

            <div id="print-expenses" className="hidden p-6 bg-white text-black swadhinota-font">
              <h2 className="text-xl font-black text-center border-b-2 border-black pb-2 mb-4">Company Expense Ledger</h2>
              <p className="text-xs font-bold mb-2">Print Filter: {printPeriod.toUpperCase()} | Total Value: ৳ {finalPrintTotalExp}</p>
              <table className="w-full border-collapse border border-black text-xs"><thead><tr className="bg-gray-100"><th>Date</th><th>Description</th><th>Spender</th><th>Entry By</th><th>Amount (৳)</th></tr></thead>
                <tbody>{finalPrintExpense.map(r => <tr key={r.id}><td>{new Date(r.date).toLocaleDateString('en-GB')}</td><td>{r.description}</td><td>{r.spender}</td><td>{r.createdBy}</td><td style={{textAlign:'right', fontWeight:'bold'}}>{r.amount}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}