'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Package, FileText, X, Save, ShoppingCart, Printer, Plus, Trash2, Edit, UserCircle, CheckSquare, Square, ArrowDownLeft, ArrowUpRight, RotateCcw, Wallet, Calendar, UserPlus, Filter, ShieldAlert, Activity, ChevronDown, ChevronUp } from 'lucide-react';

const STAFF_MEMBERS = ['Awlad Hossain', 'Emdadullah Sakib', 'Omar Faruque'];

export default function AdminInventoryPanel({ existingItems }: { existingItems: string[] }) {
  const [mounted, setMounted] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState('Admin');
  
  const isSuperAdmin = loggedInUser.toLowerCase() === 'ksitrade0@gmail.com';

  const [authTarget, setAuthTarget] = useState<'inventory' | 'expense' | 'activity' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [activePanel, setActivePanel] = useState<'inventory' | 'expense' | 'activity' | null>(null);
  const [invTab, setInvTab] = useState<'entry' | 'statement'>('entry');

  const [statementData, setStatementData] = useState<any[]>([]);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);
  
  const [statementFilterType, setStatementFilterType] = useState('all'); 
  const [statementDateVal, setStatementDateVal] = useState('');
  
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [expandedStatementId, setExpandedStatementId] = useState<string | null>(null);
  
  // এডিটের জন্য স্টেট
  const [editModalData, setEditModalData] = useState<any>(null);
  
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

  // Activity Log State
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [actFilter, setActFilter] = useState('all');

  const [printModalTarget, setPrintModalTarget] = useState<'expense' | null>(null);

  useEffect(() => { 
    setMounted(true); 
    setExpDate(new Date().toISOString().split('T')[0]);
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
        setLoggedInUser(username);
        setExpSpender(username);
        setActivePanel(authTarget); setAuthTarget(null); setPassword('');
        if (authTarget === 'inventory') fetchStatement();
        if (authTarget === 'expense') fetchExpenses();
        if (authTarget === 'activity') fetchActivities();
      } else { alert('❌ ভুল জিমেইল বা পাসওয়ার্ড!'); setPassword(''); }
    } catch (err) { alert('সার্ভার সমস্যা!'); } finally { setIsVerifying(false); }
  };

  const closePanel = () => { setActivePanel(null); setPartyName(''); setReturnInvoice(''); setPurchaseItems([{ itemName: '', quantity: 1, buyingPrice: 0 }]); setExpenseItems([{ description: '', amount: '' }]); setEditModalData(null); };

  const logActivity = async (action: string, details: string) => {
    try { await fetch('/api/activity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, details, performed_by: loggedInUser }) }); } catch(err) {}
  };

  const fetchActivities = async () => {
    try { const res = await fetch('/api/activity'); const data = await res.json(); setActivityLogs(data.data || []); } catch (err) {}
  };

  // =================== INVENTORY LOGIC ===================
  const fetchStatement = async () => {
    setIsLoadingStatement(true);
    try {
      const res = await fetch(`/api/stock/statement?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setStatementData(data.data || []); 
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
        const itemsList = purchaseItems.map(i => `${i.itemName} (${i.quantity} pcs)`).join(', ');
        await logActivity('ADD_STOCK', `Type: ${entryType} | Party: ${finalParty} | Items: ${itemsList}`);
        
        alert('✅ সফলভাবে স্টক ইনভেন্টরি যুক্ত হয়েছে!'); setPartyName(''); setReturnInvoice(''); setPurchaseItems([{ itemName: '', quantity: 1, buyingPrice: 0 }]);
        fetchStatement(); 
        window.dispatchEvent(new Event('stockUpdated')); 
      } else alert('❌ ডেটাবেজ সেভ হতে সমস্যা হয়েছে!');
    } catch (err) { alert('❌ নেটওয়ার্ক এরর!'); } finally { setIsSaving(false); }
  };

  // 🚀 মডিফাইড: ব্লকার রিমুভ করে সরাসরি ইনভেন্টরি থেকে ডিলিট
  const handleDeleteStatementRow = async (row: any) => {
    if (!isSuperAdmin) return alert('অ্যাডমিন ছাড়া ডিলিট করার অনুমতি নেই!');
    const idsToDelete = row.rawIds && row.rawIds.length > 0 ? row.rawIds : [row.id];
    
    if (!confirm('সতর্কবার্তা! আপনি কি ইনভেন্টরি থেকে এই এন্ট্রিটি মুছে ফেলতে চান? (ড্যাশবোর্ডের অর্ডারে কোনো প্রভাব পড়বে না)')) return;
    
    let hasError = false;
    try {
      for (const rawId of idsToDelete) {
        const realId = String(rawId).replace(/^(pur-|out-|res-|ord-out-)/, '');
        const originalRow = statementData.find(r => r.id === rawId) || row;
        const rowType = originalRow.type || row.type;
        
        const payload = { id: realId, deletedBy: loggedInUser, rowType: rowType, rawId: rawId };

        let res = await fetch(`/api/purchases/${realId}`, { 
          method: 'DELETE', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(payload) 
        });

        if (res.status === 404 || res.status === 405) {
          res = await fetch(`/api/purchases`, { 
            method: 'DELETE', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
          });
        }

        if (!res.ok) {
          hasError = true;
        } else {
          await logActivity('DELETE_STOCK', `Manual Delete -> Ref: ${originalRow.reference} | Item: ${originalRow.itemName} | Qty: ${originalRow.quantity} | Type: ${originalRow.type}`);
        }
      }
      
      fetchStatement(); 
      window.dispatchEvent(new Event('stockUpdated'));

      if (hasError) alert('⚠️ কিছু রেকর্ড মুছতে সমস্যা হয়েছে।');
      else alert('✅ এন্ট্রি সফলভাবে মুছে ফেলা হয়েছে!');
    } catch (err: any) { alert(`❌ সার্ভার এরর!`); }
  };

  // 🚀 মডিফাইড: ব্লকার রিমুভ করে সরাসরি বাল্ক ডিলিট
  const handleBulkDeleteStatement = async () => {
    if (!isSuperAdmin) return alert('অ্যাডমিন ছাড়া ডিলিট করার অনুমতি নেই!');
    if (selectedRowIds.length === 0) return alert('ডিলিট করার জন্য কোনো এন্ট্রি সিলেক্ট করা হয়নি।');
    
    if (!confirm(`সতর্কবার্তা! আপনি কি সিলেক্ট করা ${selectedRowIds.length} টি রেকর্ড ইনভেন্টরি থেকে মুছে ফেলতে চান? (ড্যাশবোর্ডের অর্ডার নিরাপদ থাকবে)`)) return;
    
    const rawIdsToDelete: string[] = [];
    selectedRowIds.forEach(id => {
      const groupRow = groupedStatement.find(r => r.id === id);
      const idsToCheck = (groupRow && groupRow.rawIds && groupRow.rawIds.length > 0) ? groupRow.rawIds : [id];
      
      idsToCheck.forEach((rawId: string) => {
        rawIdsToDelete.push(String(rawId));
      });
    });

    let hasError = false;
    try {
      for (const rawId of rawIdsToDelete) {
        const realId = String(rawId).replace(/^(pur-|out-|res-|ord-out-)/, '');
        const originalRow = statementData.find(r => r.id === rawId);
        const rowType = originalRow?.type || (String(rawId).includes('out-') ? 'STOCK_OUT' : 'STOCK_IN');
        
        const payload = { id: realId, deletedBy: loggedInUser, rowType: rowType, rawId: rawId };

        let res = await fetch(`/api/purchases/${realId}`, { 
          method: 'DELETE', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(payload) 
        });

        if (res.status === 404 || res.status === 405) {
          res = await fetch(`/api/purchases`, { 
            method: 'DELETE', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
          });
        }

        if (!res.ok) hasError = true;
      }
      
      if (!hasError) await logActivity('BULK_DELETE_STOCK', `Deleted ${rawIdsToDelete.length} manual entries.`);
      
      setSelectedRowIds([]);
      fetchStatement(); 
      window.dispatchEvent(new Event('stockUpdated')); 

      if (hasError) alert('⚠️ কিছু রেকর্ড মুছতে সমস্যা হয়েছে।');
      else alert('✅ ম্যানুয়াল এন্ট্রিগুলো সফলভাবে মুছে ফেলা হয়েছে!');
    } catch (err: any) { alert(`❌ সার্ভার এরর!`); }
  };

  // সম্পূর্ণ ও নিখুঁত আইটেম ব্রেকডাউন প্রসেসিং
  const groupedStatement = useMemo(() => {
    let filtered = statementData;
    if (statementFilterType === 'day' && statementDateVal) {
      filtered = statementData.filter(row => row.date && row.date.startsWith(statementDateVal));
    } else if (statementFilterType === 'month' && statementDateVal) {
      filtered = statementData.filter(row => row.date && row.date.startsWith(statementDateVal));
    } else if (statementFilterType === 'year' && statementDateVal) {
      filtered = statementData.filter(row => row.date && new Date(row.date).getFullYear().toString() === statementDateVal);
    }

    const groups: any[] = []; const map = new Map();
    filtered.forEach(row => {
      const key = (row.reference && row.reference.trim() !== '' && !row.reference.includes('রিটার্ন')) ? `${row.reference}-${row.type}-${row.date?.split('T')[0]}` : row.id;
      if (map.has(key)) {
        const ext = map.get(key);
        if(!ext.itemNames.includes(row.itemName)) ext.itemNames.push(row.itemName);
        ext.quantity += Number(row.quantity); 
        ext.total += Number(row.total); 
        ext.rawIds.push(row.id);
        ext.breakdown.push({ name: row.itemName, qty: row.quantity, price: row.buyingPrice || 0, rawId: row.id, realId: String(row.id).replace(/^(pur-|out-|res-|ord-out-)/, ''), type: row.type });
      } else { 
        map.set(key, { 
          ...row, 
          itemNames: [row.itemName], 
          quantity: Number(row.quantity), 
          total: Number(row.total), 
          rawIds: [row.id], 
          breakdown: [{ name: row.itemName, qty: row.quantity, price: row.buyingPrice || 0, rawId: row.id, realId: String(row.id).replace(/^(pur-|out-|res-|ord-out-)/, ''), type: row.type }] 
        }); 
      }
    });
    map.forEach(val => { val.itemName = val.itemNames.join(' / '); groups.push(val); });
    return groups;
  }, [statementData, statementFilterType, statementDateVal]);

  // প্রফেশনাল করপোরেট লেআউট সহ সরাসরি প্রিন্ট ফাংশন
  const triggerSelectedStockPrint = () => {
    if (selectedRowIds.length === 0) return alert('প্রিন্ট করার জন্য বাম পাশ থেকে অন্তত একটি রেকর্ড সিলেক্ট করুন।');
    const printContent = document.getElementById('print-selected-statement');
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Stock Statement Report</title>
          <style>
            @page { size: A4 portrait; margin: 15mm 12mm 15mm 12mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header-box { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
            .company-name { font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; }
            .report-title { font-size: 13px; font-weight: 700; color: #475569; letter-spacing: 0.5px; text-transform: uppercase; }
            .meta-bar { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th { background-color: #0f172a !important; color: #ffffff !important; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 8px 10px; border: 1px solid #0f172a; text-align: left; }
            td { font-size: 11px; padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top; color: #0f172a; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .breakdown-badge { display: inline-block; background-color: #f1f5f9; border: 1px solid #94a3b8; padding: 3px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; margin: 2px 4px 2px 0; color: #0f172a; }
            .signatures-container { margin-top: 60px; display: flex; justify-content: space-between; padding: 0 40px; }
            .sig-block { text-align: center; }
            .sig-line { width: 180px; border-top: 1.5px dashed #475569; margin-bottom: 6px; }
            .sig-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #334155; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>setTimeout(() => { window.print(); window.close(); }, 400);</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } else alert('পপ-আপ ব্লকার চালু আছে!');
  };

  // =================== EXPENSE LOGIC ===================
  const fetchExpenses = async () => {
    setIsLoadingStatement(true);
    try { const res = await fetch(`/api/expenses?_t=${Date.now()}`, { cache: 'no-store' }); const data = await res.json(); setExpensesData(data.data || []); } 
    catch (err) { setExpensesData([]); } finally { setIsLoadingStatement(false); }
  };
  const handleExpItemChange = (index: number, field: string, value: any) => { const updated = [...expenseItems]; (updated[index] as any)[field] = value; setExpenseItems(updated); };
  const removeExpItem = (index: number) => { const updated = expenseItems.filter((_, i) => i !== index); setExpenseItems(updated.length > 0 ? updated : [{ description: '', amount: '' }]); };
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault(); const finalSpender = expSpender === 'add_new' ? expCustomSpender : expSpender;
    if (!finalSpender || expenseItems.some(i => !i.description || !i.amount)) return alert('অনুগ্রহ করে সব তথ্য দিন।');
    setIsSaving(true);
    try {
      const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: expDate, spender: finalSpender, createdBy: loggedInUser, items: expenseItems }) });
      if (res.ok) { alert('✅ খরচের হিসাব সেভ হয়েছে!'); setExpenseItems([{ description: '', amount: '' }]); setExpCustomSpender(''); fetchExpenses(); } else alert('❌ সেভ হতে সমস্যা হয়েছে!');
    } catch (err) { alert('❌ নেটওয়ার্ক এরর!'); } finally { setIsSaving(false); }
  };
  const handleDeleteExpense = async (id: number) => {
    if (!isSuperAdmin) return alert('অ্যাডমিন ছাড়া ডিলিট করার অনুমতি নেই!');
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
  const getWeekNumber = (d: Date) => { const d2 = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const dayNum = d2.getUTCDay() || 7; d2.setUTCDate(d2.getUTCDate() + 4 - dayNum); const yearStart = new Date(Date.UTC(d2.getUTCFullYear(), 0, 1)); return Math.ceil((((d2.getTime() - yearStart.getTime()) / 86400000) + 1) / 7); };
  const formatWeek = (dateStr: string) => { if(!dateStr) return 'N/A'; const d = new Date(dateStr); return `Week ${getWeekNumber(d)} (${d.toLocaleString('en-GB', { month: 'short' })})`; };
  const toggleSelectRow = (id: string) => { setSelectedRowIds(selectedRowIds.includes(id) ? selectedRowIds.filter(i => i !== id) : [...selectedRowIds, id]); };
  const toggleSelectAll = () => { setSelectedRowIds(selectedRowIds.length === groupedStatement.length ? [] : groupedStatement.map(r => r.id)); };
  const triggerExpensePrint = () => {
    const printContent = document.getElementById('print-expenses'); if (!printContent) return; const printWindow = window.open('', '_blank');
    if (printWindow) { printWindow.document.write(`<html><head><title>Expense Report</title><style>body{font-family:sans-serif;padding:20px} table{width:100%;border-collapse:collapse;margin-top:15px} th,td{border:1px solid #333;padding:8px;font-size:12px} th{background:#f1f5f9;text-align:left}</style></head><body>${printContent.outerHTML}<script>setTimeout(()=>{window.print();window.close();},500);</script></body></html>`); printWindow.document.close(); } else alert('পপ-আপ ব্লকার চালু আছে!');
    setPrintModalTarget(null);
  };
  const selectedPrintStockList = groupedStatement.filter(r => selectedRowIds.includes(r.id));
  const finalPrintTotalStock = selectedPrintStockList.reduce((sum, row) => sum + Number(row.total || 0), 0);
  const finalPrintTotalQty = selectedPrintStockList.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const finalPrintTotalExp = filteredExpenses.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-1.5 w-48">
      <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Tiro+Bangla:ital@0;1&display=swap'); .swadhinota-font { font-family: 'Swadhinota', 'Tiro Bangla', sans-serif; letter-spacing: 0.5px; }`}} />

      <button onClick={() => setAuthTarget('inventory')} className="w-full h-[36px] flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition shadow-2xs border border-slate-800 cursor-pointer"><Package className="w-3.5 h-3.5 text-amber-400" /> ইনভেন্টরি ও স্টক লেজার</button>
      <button onClick={() => setAuthTarget('expense')} className="w-full h-[36px] flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-bold transition shadow-2xs border border-slate-300 cursor-pointer"><Wallet className="w-3.5 h-3.5 text-rose-600" /> কোম্পানির খরচের হিসাব</button>
      {isSuperAdmin && (<button onClick={() => setAuthTarget('activity')} className="w-full h-[36px] flex items-center justify-center gap-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg text-xs font-bold transition shadow-2xs border border-rose-300 cursor-pointer mt-1"><ShieldAlert className="w-3.5 h-3.5 text-rose-700" /> সুপার অ্যাক্টিভিটি লগ</button>)}

      {authTarget && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4">
          <form onSubmit={handleAuth} className="bg-white/90 p-10 rounded-[32px] w-full max-w-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-white/50 animate-in fade-in zoom-in-90 swadhinota-font">
            <div className="flex flex-col items-center mb-8"><div className="bg-gradient-to-tr from-rose-500 to-orange-400 p-4 rounded-2xl mb-4 shadow-lg shadow-rose-500/30"><Lock className="w-8 h-8 text-white" /></div><h3 className="text-2xl font-bold text-slate-900">অ্যাডমিন আনলক</h3><p className="text-sm font-bold text-slate-500 mt-2 text-center">নিরাপদ ড্যাশবোর্ড অ্যাক্সেস করতে লগইন করুন</p></div>
            <div className="space-y-4"><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Email / ID" className="w-full bg-white border border-slate-200 p-4 rounded-2xl font-bold text-base outline-none transition shadow-inner" required /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-white border border-slate-200 p-4 rounded-2xl font-bold text-base tracking-widest outline-none transition shadow-inner" required /></div>
            <div className="flex gap-4 mt-8"><button type="button" onClick={() => setAuthTarget(null)} className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition cursor-pointer">বাতিল</button><button type="submit" disabled={isVerifying} className="w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold rounded-2xl hover:shadow-xl transition cursor-pointer">{isVerifying ? 'যাচাই হচ্ছে...' : 'লগইন'}</button></div>
          </form>
        </div>, document.body
      )}

      {printModalTarget === 'expense' && createPortal(
        <div className="fixed inset-0 z-[9999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Printer className="w-6 h-6"/></div><h3 className="text-xl font-black text-slate-900 mb-2">প্রিন্ট করুন</h3><p className="text-xs font-bold text-slate-500 mb-6">আপনি কি রিপোর্টটি প্রিন্ট করতে চান?</p><div className="flex gap-3"><button onClick={() => setPrintModalTarget(null)} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer">বাতিল</button><button onClick={triggerExpensePrint} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 cursor-pointer shadow-lg">প্রিন্ট</button></div></div>
        </div>, document.body
      )}

      {/* 🚀 এডিট (EDIT) মোডাল - শুধুমাত্র ইনভেন্টরি এন্ট্রির জন্য */}
      {editModalData && createPortal(
        <div className="fixed inset-0 z-[9999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-black text-lg">এন্ট্রি এডিট করুন ({editModalData.reference})</h3>
              <button onClick={() => setEditModalData(null)} className="text-slate-400 hover:text-white transition cursor-pointer"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-[11px] font-bold text-slate-500 bg-blue-50 border border-blue-200 p-2 rounded">
                💡 এডিট করে সেভ করলে তা সরাসরি লাইভ ইনভেন্টরিতে আপডেট হয়ে যাবে।
              </p>
              {editModalData.breakdown.map((item: any, idx: number) => (
                <div key={item.rawId} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <div className="font-black text-slate-800 text-sm border-b border-slate-200 pb-2">{item.name}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">নতুন পরিমাণ (Qty)</label>
                      <input type="number" value={item.qty} onChange={(e) => {
                        const newData = {...editModalData};
                        newData.breakdown[idx].qty = Number(e.target.value);
                        setEditModalData(newData);
                      }} className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">নতুন দাম (৳)</label>
                      <input type="number" value={item.price} onChange={(e) => {
                        const newData = {...editModalData};
                        newData.breakdown[idx].price = Number(e.target.value);
                        setEditModalData(newData);
                      }} className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setEditModalData(null)} className="px-5 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition cursor-pointer">বাতিল</button>
              <button onClick={async () => {
                setIsSaving(true);
                let hasError = false;
                try {
                  for (const item of editModalData.breakdown) {
                    const payload = { 
                      id: item.realId, quantity: Number(item.qty), buyingPrice: Number(item.price), updatedBy: loggedInUser, rowType: item.type, rawId: item.rawId
                    };
                    let res = await fetch(`/api/purchases/${item.realId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (res.status === 404 || res.status === 405) {
                      res = await fetch(`/api/purchases`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    }
                    if (!res.ok) hasError = true;
                  }
                  if (!hasError) {
                    alert('✅ এন্ট্রি সফলভাবে আপডেট হয়েছে!'); setEditModalData(null); 
                    fetchStatement(); 
                    window.dispatchEvent(new Event('stockUpdated')); // লাইভ ইনভেন্টরি আপডেট
                  } else alert('⚠️ সার্ভারে সমস্যা হয়েছে।');
                } catch(err) { alert('❌ নেটওয়ার্ক এরর!'); } finally { setIsSaving(false); }
              }} disabled={isSaving} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-lg cursor-pointer">
                {isSaving ? 'সেভ হচ্ছে...' : <><Save className="w-4 h-4"/> আপডেট সেভ করুন</>}
              </button>
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
                <div className="flex flex-wrap justify-between items-center mb-4 gap-3 no-print bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <select 
                      value={statementFilterType} 
                      onChange={(e) => { setStatementFilterType(e.target.value); setStatementDateVal(''); }} 
                      className="border border-slate-300 px-3 py-2 rounded-lg text-xs font-black bg-white outline-none cursor-pointer"
                    >
                      <option value="selected_item">🔍 সিলেক্টেড আইটেম</option>
                      <option value="day">📅 নির্দিষ্ট দিন</option>
                      <option value="month">📆 মাসের হিসাব</option>
                      <option value="year">📊 বছরের হিসাব</option>
                      <option value="all">📂 সব রেকর্ড</option>
                    </select>

                    {statementFilterType !== 'all' && statementFilterType !== 'selected_item' && (
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 shadow-2xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <input 
                          type={statementFilterType === 'day' ? 'date' : statementFilterType === 'month' ? 'month' : 'number'}
                          value={statementDateVal}
                          onChange={(e) => setStatementDateVal(e.target.value)}
                          placeholder={statementFilterType === 'year' ? 'YYYY (যেমন: 2026)' : ''}
                          className="text-xs font-bold bg-transparent text-slate-900 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isSuperAdmin && <button onClick={handleBulkDeleteStatement} className="bg-rose-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"><Trash2 className="w-4 h-4"/> সিলেক্টেড ডিলিট</button>}
                    <button onClick={triggerSelectedStockPrint} className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
                      <Printer className="w-4 h-4 text-amber-400"/> প্রিন্ট করুন
                    </button>
                  </div>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 w-10 text-center"><button onClick={toggleSelectAll} className="cursor-pointer text-slate-700">{selectedRowIds.length === groupedStatement.length ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4" />}</button></th>
                        <th className="px-5 py-3">তারিখ ও সময়</th><th className="px-5 py-3">সপ্তাহ/মাস</th><th className="px-5 py-3">ধরণ</th><th className="px-5 py-3">পার্টি/রেফারেন্স</th><th className="px-5 py-3">আইটেম (বিস্তারিত ব্রেকডাউন)</th><th className="px-5 py-3 text-center">পরিমাণ</th><th className="px-5 py-3 text-right">মোট (৳)</th><th className="px-5 py-3 text-center w-24">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupedStatement.map((row, idx) => {
                        const currentDate = row.date ? new Date(row.date).toLocaleDateString('en-GB') : 'N/A';
                        const prevDate = idx > 0 && groupedStatement[idx - 1].date ? new Date(groupedStatement[idx - 1].date).toLocaleDateString('en-GB') : null;
                        const isSelected = selectedRowIds.includes(row.id);
                        const isExpanded = expandedStatementId === row.id;
                        
                        // ড্যাশবোর্ডের অর্ডার চেক
                        const isDashboardOrder = row.rawIds && row.rawIds.some((id: string) => String(id).startsWith('ord-out-'));

                        return (
                          <React.Fragment key={row.id}>
                            {currentDate !== prevDate && <tr><td colSpan={9} className="bg-slate-800 text-amber-400 font-black text-xs text-center py-2 border-y-4 border-slate-950">📅 {currentDate} এর ট্রানজেকশন</td></tr>}
                            <tr className={`hover:bg-slate-50 ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                              <td className="px-4 py-3 text-center"><button onClick={() => toggleSelectRow(row.id)} className="cursor-pointer text-slate-600">{isSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-300" />}</button></td>
                              <td className="px-5 py-3 text-xs font-bold text-slate-600"><div>{row.date ? new Date(row.date).toLocaleString('en-GB') : 'N/A'}</div>{row.createdBy && <div className="text-[10px] text-blue-600 font-black mt-1">👤 {row.createdBy}</div>}</td>
                              <td className="px-5 py-3 text-[11px] font-black text-slate-500">{formatWeek(row.date)}</td>
                              <td className="px-5 py-3 text-[11px] font-black">{row.type === 'STOCK_IN' ? '🟢 IN' : row.type === 'STOCK_OUT' ? '🔴 OUT' : '🔵 RESTORED'}</td>
                              <td className="px-5 py-3 text-xs font-black text-slate-800">{row.reference}</td>
                              
                              <td className="px-5 py-3 text-[11px] font-bold text-slate-700 bg-slate-50 border-l border-r border-slate-100">
                                <div className="flex items-center justify-between gap-2">
                                  <span>{row.itemName}</span>
                                  {row.breakdown && row.breakdown.length > 0 && (
                                    <button 
                                      onClick={() => setExpandedStatementId(isExpanded ? null : row.id)}
                                      className="text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 cursor-pointer shrink-0 border border-blue-200"
                                    >
                                      <span>ব্যাখ্যা</span>
                                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                  )}
                                </div>
                              </td>

                              <td className="px-5 py-3 text-center text-xs font-black">{row.type === 'STOCK_OUT' ? `-${row.quantity}` : `+${row.quantity}`}</td>
                              <td className="px-5 py-3 text-right text-xs font-black">৳ {row.total}</td>
                              <td className="px-5 py-3 text-center w-24">
                                {isSuperAdmin ? (
                                  <div className="flex justify-center gap-1.5">
                                    {/* 🚀 ড্যাশবোর্ডের অর্ডার এডিট করা যাবে না, কিন্তু ডিলিট করা যাবে */}
                                    {!isDashboardOrder && (
                                      <button onClick={() => setEditModalData(JSON.parse(JSON.stringify(row)))} title="এডিট করুন" className="text-blue-500 hover:bg-blue-50 p-1.5 rounded cursor-pointer transition"><Edit className="w-4 h-4"/></button>
                                    )}
                                    <button onClick={() => handleDeleteStatementRow(row)} title="ডিলিট করুন" className="text-rose-500 hover:bg-rose-50 p-1.5 rounded cursor-pointer transition"><Trash2 className="w-4 h-4"/></button>
                                  </div>
                                ) : (
                                  <span className="text-[9px] font-black text-slate-300">Admin Only</span>
                                )}
                              </td>
                            </tr>

                            {isExpanded && row.breakdown && (
                              <tr>
                                <td colSpan={9} className="bg-slate-50/80 p-3 border-b border-slate-200 shadow-inner">
                                  <div className="bg-white border border-slate-300 rounded-lg p-3 max-w-xl mx-auto">
                                    <h5 className="text-[11px] font-black text-slate-900 mb-2 uppercase tracking-wide border-b pb-1 flex justify-between">
                                      <span>📦 ভ্যারাইটিস আইটেম ব্রেকডাউন ব্যাখ্যা ({row.reference})</span>
                                      <span className="text-emerald-700">মোট: {row.quantity} পিস</span>
                                    </h5>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                      {row.breakdown.map((b: any, bIdx: number) => (
                                        <div key={bIdx} className="flex justify-between items-center bg-slate-100 border border-slate-200 px-2 py-1 rounded text-[11px] font-bold">
                                          <span className="text-slate-700">{b.name}:</span>
                                          <span className="font-black text-slate-950 bg-white px-1.5 py-0.5 rounded border border-slate-200">{b.qty} পিস</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 🚀 কর্পোরেট ও প্রফেশনাল প্রিন্ট টেমপ্লেট 🚀 */}
                <div id="print-selected-statement" className="hidden">
                   <div className="header-box">
                     <div className="company-name">BlackRock Corporation × RUHAMA WEAR</div>
                     <div className="report-title">Stock Statement & Inventory Report</div>
                   </div>

                   <div className="meta-bar">
                     <div><b>প্রিন্ট তারিখ ও সময়:</b> {new Date().toLocaleString('en-GB')}</div>
                     <div><b>রিপোর্ট টাইপ:</b> {statementFilterType === 'all' ? 'সকল লেনদেন' : statementFilterType === 'selected_item' ? 'নির্বাচিত আইটেম' : 'নির্দিষ্ট ফিল্টার'}</div>
                     <div><b>অপারেটর:</b> {loggedInUser}</div>
                   </div>

                   <table>
                     <thead>
                       <tr>
                         <th style={{width: '14%'}}>তারিখ ও সময়</th>
                         <th style={{width: '12%'}}>সপ্তাহ/মাস</th>
                         <th style={{width: '8%'}}>ধরণ</th>
                         <th style={{width: '16%'}}>পার্টি / রেফারেন্স</th>
                         <th>আইটেম ও বিস্তারিত ব্যাখ্যা</th>
                         <th style={{width: '10%', textAlign: 'center'}}>পরিমাণ</th>
                         <th style={{width: '12%', textAlign: 'right'}}>মোট (৳)</th>
                       </tr>
                     </thead>
                     <tbody>
                       {selectedPrintStockList.map(r => (
                         <tr key={r.id}>
                           <td>{new Date(r.date).toLocaleString('en-GB')}</td>
                           <td>{formatWeek(r.date)}</td>
                           <td style={{fontWeight: 'bold'}}>{r.type === 'STOCK_IN' ? 'IN' : r.type === 'STOCK_OUT' ? 'OUT' : 'RESTORE'}</td>
                           <td style={{fontWeight: 'bold'}}>{r.reference}</td>
                           <td>
                             <div style={{fontWeight: 'bold', marginBottom: '4px'}}>{r.itemName}</div>
                             {r.breakdown && r.breakdown.length > 0 && (
                               <div style={{marginTop: '4px'}}>
                                 {r.breakdown.map((bk: any, bi: number) => (
                                   <span key={bi} className="breakdown-badge">
                                     {bk.name}: <b>{bk.qty} pcs</b>
                                   </span>
                                 ))}
                               </div>
                             )}
                           </td>
                           <td style={{textAlign: 'center', fontWeight: 'bold'}}>{r.quantity}</td>
                           <td style={{textAlign: 'right', fontWeight: 'bold'}}>{Number(r.total || 0).toLocaleString('en-BD')}</td>
                         </tr>
                       ))}
                       <tr style={{background: '#f1f5f9', fontWeight: 'bold'}}>
                         <td colSpan={5} style={{textAlign: 'right', fontWeight: '900', textTransform: 'uppercase'}}>সর্বমোট (Grand Total):</td>
                         <td style={{textAlign: 'center', fontWeight: '900'}}>{finalPrintTotalQty} pcs</td>
                         <td style={{textAlign: 'right', fontWeight: '900'}}>৳ {finalPrintTotalStock.toLocaleString('en-BD')}</td>
                       </tr>
                     </tbody>
                   </table>

                   <div className="signatures-container">
                     <div className="sig-block">
                       <div className="sig-line"></div>
                       <div className="sig-label">Prepared By</div>
                     </div>
                     <div className="sig-block">
                       <div className="sig-line"></div>
                       <div className="sig-label">Authorized Signature</div>
                     </div>
                   </div>
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
                  <button onClick={() => setPrintModalTarget('expense')} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Printer className="w-4 h-4"/> প্রিন্ট করুন</button>
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
                             <td className="px-5 py-3 text-xs font-bold text-slate-600">{currentDate} <div className="text-[9px] text-blue-500 mt-0.5">👤 {row.createdBy}</div></td><td className="px-5 py-3 text-xs font-black text-slate-800">{row.description}</td><td className="px-5 py-3 text-xs font-bold text-slate-600 flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5"/>{row.spender}</td><td className="px-5 py-3 text-right text-sm font-black text-rose-600">৳ {row.amount}</td>
                             <td className="px-5 py-3 text-center">
                               {isSuperAdmin ? (
                                 <button onClick={() => handleDeleteExpense(row.id)} className="text-rose-400 hover:bg-rose-50 p-1.5 rounded cursor-pointer"><Trash2 className="w-4 h-4"/></button>
                               ) : (
                                 <span className="text-[9px] font-black text-slate-300">Admin Only</span>
                               )}
                             </td>
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
              <p className="text-xs font-bold mb-2">Total Value: ৳ {finalPrintTotalExp}</p>
              <table className="w-full border-collapse border border-black text-xs"><thead><tr className="bg-gray-100"><th>Date</th><th>Description</th><th>Spender</th><th>Entry By</th><th>Amount (৳)</th></tr></thead>
                <tbody>{filteredExpenses.map(r => <tr key={r.id}><td>{new Date(r.date).toLocaleDateString('en-GB')}</td><td>{r.description}</td><td>{r.spender}</td><td>{r.createdBy}</td><td style={{textAlign:'right', fontWeight:'bold'}}>{r.amount}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>, document.body
      )}

      {activePanel === 'activity' && isSuperAdmin && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-100 flex flex-col w-screen h-screen">
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-xs no-print">
            <div className="flex items-center gap-3"><div className="bg-rose-600 p-2.5 rounded-xl shadow-sm"><ShieldAlert className="w-5 h-5 text-white" /></div><div><h2 className="text-lg font-black uppercase text-slate-900">সুপার অ্যাক্টিভিটি ও ডিলিট হিস্ট্রি</h2><p className="text-[11px] font-bold text-slate-500">সিস্টেমের এন্ট্রি এবং মুছে ফেলা সকল ডাটার সিক্রেট লগ</p></div></div>
            <div className="flex items-center gap-4">
              <select value={actFilter} onChange={e=>setActFilter(e.target.value)} className="border border-slate-300 px-3 py-2 rounded-lg text-xs font-black bg-white outline-none cursor-pointer">
                <option value="all">সব অ্যাক্টিভিটি দেখুন</option><option value="ADD">শুধুমাত্র এন্ট্রি (Add)</option><option value="DELETE">শুধুমাত্র ডিলিট (Delete)</option>
              </select>
              <button onClick={closePanel} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"><X className="w-6 h-6" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
                  <tr><th className="px-5 py-4 w-40">তারিখ ও সময়</th><th className="px-5 py-4 w-40">অ্যাকশন</th><th className="px-5 py-4">বিস্তারিত বিবরণ</th><th className="px-5 py-4 w-48">পারফর্ম করেছে</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activityLogs.filter(log => actFilter === 'all' || log.action.includes(actFilter)).length === 0 ? <tr><td colSpan={4} className="p-10 text-center font-bold text-slate-400">কোনো হিস্ট্রি নেই</td></tr> :
                   activityLogs.filter(log => actFilter === 'all' || log.action.includes(actFilter)).map((log) => {
                       const isDelete = log.action.includes('DELETE');
                       const actionColor = isDelete ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-rose-200';
                       return (
                         <tr key={log.id} className="hover:bg-slate-50">
                             <td className="px-5 py-4 text-[11px] font-bold text-slate-600">{new Date(log.created_at).toLocaleString('en-GB')}</td>
                             <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded text-[10px] font-black tracking-widest ${actionColor}`}>{log.action.replace(/_/g, ' ')}</span></td>
                             <td className="px-5 py-4 text-xs font-bold text-slate-700 leading-relaxed">{log.details}</td>
                             <td className="px-5 py-4 text-xs font-black text-blue-700 flex items-center gap-1.5 mt-2"><Activity className="w-3.5 h-3.5"/>{log.performed_by}</td>
                         </tr>
                       );
                   })}
                </tbody>
              </table>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}