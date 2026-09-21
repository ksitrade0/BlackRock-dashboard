'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Package, FileText, X, Save, ShoppingCart, Printer, Plus, Trash2, UserCircle, CheckSquare, Square, ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react';

export default function AdminInventoryPanel({ existingItems }: { existingItems: string[] }) {
  const [mounted, setMounted] = useState(false);
  const [authTarget, setAuthTarget] = useState<'entry' | 'statement' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [activePanel, setActivePanel] = useState<'entry' | 'statement' | null>(null);

  const [statementData, setStatementData] = useState<any[]>([]);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);

  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  const [partyName, setPartyName] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([{ itemName: '', quantity: 1, buyingPrice: 0 }]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActivePanel(authTarget);
        setAuthTarget(null);
        setPassword('');
        if (authTarget === 'statement') {
          fetchStatement();
        }
      } else {
        alert('❌ ভুল জিমেইল বা পাসওয়ার্ড! আবার চেষ্টা করুন।');
        setPassword('');
      }
    } catch (err) {
      alert('সার্ভার সমস্যা!');
    } finally {
      setIsVerifying(false);
    }
  };

  const closePanel = () => {
    setActivePanel(null);
    setPartyName('');
    setPurchaseItems([{ itemName: '', quantity: 1, buyingPrice: 0 }]);
  };

  const fetchStatement = async () => {
    setIsLoadingStatement(true);
    try {
      const res = await fetch('/api/stock/statement');
      const data = await res.json();
      const rows = data.data || [];
      setStatementData(rows);
      setSelectedRowIds(rows.map((r: any) => r.id));
    } catch (err) {
      console.error(err);
      setStatementData([]);
    } finally {
      setIsLoadingStatement(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...purchaseItems];
    (updated[index] as any)[field] = value;
    setPurchaseItems(updated);
  };

  const handleRemoveItemRow = (index: number) => {
    const updated = purchaseItems.filter((_, i) => i !== index);
    setPurchaseItems(updated.length > 0 ? updated : [{ itemName: '', quantity: 1, buyingPrice: 0 }]);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partyName, items: purchaseItems }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert('✅ সফলভাবে স্টক ইনভেন্টরি যুক্ত হয়েছে!');
        closePanel();
        window.dispatchEvent(new Event('stockUpdated'));
      } else {
        alert('❌ ডেটাবেজ সেভ হতে সমস্যা হয়েছে: ' + (result.error || 'অজানা ত্রুটি'));
      }
    } catch (err) {
      alert('❌ নেটওয়ার্ক বা সার্ভার এরর!');
    } finally {
      setIsSaving(false);
    }
  };

  // স্টক স্টেটমেন্ট থেকে সিঙ্গেল পারচেজ ডিলিট
  const handleDeleteStatementRow = async (rowId: string) => {
    if (!rowId.startsWith('pur-')) {
      alert('⚠️ শুধুমাত্র পারচেজ এন্ট্রি (Stock In) ডিলিট করা সম্ভব।');
      return;
    }
    if (!confirm('সতর্কবার্তা! আপনি কি এই পারচেজ রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?')) return;

    const realId = rowId.replace('pur-', '');
    try {
      const res = await fetch(`/api/purchases/${realId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('✅ পারচেজ সফলভাবে ডিলিট হয়েছে!');
        fetchStatement();
        window.dispatchEvent(new Event('stockUpdated'));
      } else {
        alert('❌ ডিলিট করতে সমস্যা হয়েছে: ' + (data.error || ''));
      }
    } catch (err) {
      alert('❌ সার্ভার সমস্যা!');
    }
  };

  // স্টক স্টেটমেন্ট থেকে একসাথে একাধিক (Bulk) ডিলিট
  const handleBulkDeleteStatement = async () => {
    const purIds = selectedRowIds.filter(id => id.startsWith('pur-')).map(id => id.replace('pur-', ''));
    if (purIds.length === 0) {
      alert('ডিলিট করার জন্য কোনো পারচেজ এন্ট্রি সিলেক্ট করা হয়নি।');
      return;
    }
    if (!confirm(`সতর্কবার্তা! আপনি কি সিলেক্ট করা ${purIds.length} টি পারচেজ রেকর্ড স্থায়ীভাবে মুছে ফেলতে চান?`)) return;

    try {
      for (const id of purIds) {
        await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
      }
      alert('✅ সিলেক্টেড রেকর্ডগুলো সফলভাবে ডিলিট হয়েছে!');
      fetchStatement();
      window.dispatchEvent(new Event('stockUpdated'));
      setSelectedRowIds([]);
    } catch (err) {
      alert('❌ বাল্ক ডিলিট করতে সমস্যা হয়েছে!');
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedRowIds.includes(id)) {
      setSelectedRowIds(selectedRowIds.filter(i => i !== id));
    } else {
      setSelectedRowIds([...selectedRowIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.length === filteredStatement.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredStatement.map(r => r.id));
    }
  };

  const filteredStatement = statementData.filter(row => {
    if (selectedTypeFilter === 'all') return true;
    return row.type === selectedTypeFilter;
  });

  const printableData = filteredStatement.filter(row => selectedRowIds.includes(row.id));
  const grandTotalCost = printableData.reduce((sum, row) => sum + Number(row.total || 0), 0);

  const handlePrint = () => {
    const printContent = document.getElementById('printable-invoice');
    if (!printContent) return;
    const styles = document.head.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Stock Statement Report</title>
            ${styles}
            <style>
              body { background-color: white !important; margin: 0; padding: 20px; color: black; font-family: sans-serif; }
              #printable-invoice { display: block !important; width: 100%; position: static !important; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #333; padding: 8px 12px; font-size: 12px; }
              th { background-color: #f1f5f9; text-align: left; }
              html, body { height: auto !important; overflow: visible !important; }
              @page { size: A4 portrait; margin: 10mm; }
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
            <script>
              setTimeout(() => {
                window.focus();
                window.print();
                window.close();
              }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      alert('ব্রাউজারের পপ-আপ ব্লকার চালু আছে! দয়া করে Allow করুন।');
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-1.5 w-48">
      <button
        onClick={() => setAuthTarget('entry')}
        className="w-full h-[36px] flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition shadow-2xs border border-slate-800 cursor-pointer"
      >
        <Package className="w-3.5 h-3.5 text-amber-400" /> ইনভেন্টরি এন্ট্রি
      </button>
      <button
        onClick={() => setAuthTarget('statement')}
        className="w-full h-[36px] flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-bold transition shadow-2xs border border-slate-300 cursor-pointer"
      >
        <FileText className="w-3.5 h-3.5 text-indigo-600" /> স্টক স্টেটমেন্ট
      </button>

      {authTarget && createPortal(
        <div className="fixed inset-0 z-[999999] w-screen h-screen bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleAuth} className="m-auto bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-rose-50 p-4 rounded-2xl mb-3 shadow-inner">
                <Lock className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900">অ্যাডমিন ভেরিফিকেশন</h3>
              <p className="text-xs font-bold text-slate-500 mt-1 text-center">ড্যাশবোর্ড অ্যাক্সেস করতে জিমেইল ও পাসওয়ার্ড দিন</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">জিমেইল আইডি</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-xl font-bold text-sm focus:ring-2 focus:ring-slate-900 outline-none text-black"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">পাসওয়ার্ড</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="........"
                  className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-xl font-bold text-sm tracking-widest focus:ring-2 focus:ring-slate-900 outline-none text-black"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setAuthTarget(null)} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer">
                বাতিল
              </button>
              <button type="submit" disabled={isVerifying} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition flex items-center justify-center shadow-lg cursor-pointer">
                {isVerifying ? 'যাচাই হচ্ছে...' : 'আনলক করুন'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {activePanel === 'entry' && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-100 flex flex-col w-screen h-screen overflow-hidden text-left animate-in fade-in duration-200">
          <div className="bg-white border-b border-slate-200 px-6 md:px-12 py-4 flex justify-between items-center shadow-xs shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-slate-900 p-3 rounded-xl shadow-sm">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase text-slate-900 tracking-wide">পারচেজ ও ইনভেন্টরি এন্ট্রি</h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">নির্দিষ্ট প্রিসেট আইটেম থেকে সাপ্লায়ার স্টক যুক্ত করুন</p>
              </div>
            </div>
            <button onClick={closePanel} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-slate-200">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <form onSubmit={handleSavePurchase} className="max-w-5xl mx-auto space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <UserCircle className="w-5 h-5 text-indigo-600" />
                  <label className="block text-sm font-black text-slate-800">সাপ্লায়ার বা পার্টির নাম</label>
                </div>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="যেমন: রহিম ভাই (ফেব্রিক সাপ্লায়ার)..."
                  className="w-full border border-slate-300 p-3.5 rounded-xl font-bold text-sm text-black focus:border-slate-900 outline-none bg-slate-50 transition"
                  required
                />
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-6">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-4">আইটেমের বিবরণ ও দাম</h3>
                <div className="grid grid-cols-12 gap-3 p-3 border-b border-slate-200 bg-slate-100 text-[11px] font-black text-slate-600 uppercase tracking-wider text-center rounded-lg mb-3">
                  <div className="col-span-5 text-left pl-2">নির্ধারিত আইটেম</div>
                  <div className="col-span-3">পরিমাণ (পিস)</div>
                  <div className="col-span-3">কেনা দাম (প্রতি পিস ৳)</div>
                  <div className="col-span-1">বাদ</div>
                </div>

                <div className="space-y-3">
                  {purchaseItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="col-span-5">
                        <select
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          className="w-full border border-slate-300 p-3 rounded-lg text-black font-bold text-xs outline-none bg-white focus:border-slate-900 cursor-pointer"
                          required
                        >
                          <option value="">-- আইটেম সিলেক্ট করুন --</option>
                          {existingItems.map((prod, i) => <option key={i} value={prod}>{prod}</option>)}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          placeholder="পরিমাণ"
                          className="w-full border border-slate-300 p-3 rounded-lg text-center text-xs text-black font-black bg-white outline-none focus:border-slate-900"
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={item.buyingPrice || ''}
                          onChange={(e) => handleItemChange(index, 'buyingPrice', Number(e.target.value))}
                          placeholder="৳ মূল্য"
                          className="w-full border border-slate-300 p-3 rounded-lg text-center text-xs text-emerald-800 font-black bg-white outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="p-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPurchaseItems([...purchaseItems, { itemName: '', quantity: 1, buyingPrice: 0 }])}
                    className="mt-3 flex items-center justify-center gap-1.5 w-full border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl transition cursor-pointer text-xs"
                  >
                    <Plus className="w-4 h-4" /> আরেকটি আইটেম যোগ করুন
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-slate-900 text-white px-10 py-4 rounded-xl font-black text-sm hover:bg-black transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'সেভ হচ্ছে...' : 'তথ্য সেভ করুন (Save Data)'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {activePanel === 'statement' && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-100 flex flex-col w-screen h-screen overflow-hidden text-left animate-in fade-in duration-200">
          <div className="bg-white border-b border-slate-200 px-6 md:px-12 py-4 flex flex-wrap justify-between items-center gap-4 shadow-xs shrink-0 no-print">
            <div className="flex items-center gap-4">
              <div className="bg-slate-900 p-3 rounded-xl shadow-sm">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase text-slate-900 tracking-wide">স্টক স্টেটমেন্ট ও লেজার</h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">সকল ইন-আউট ও ট্রানজেকশনের সম্পূর্ণ ব্যাংক স্টেটমেন্ট</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl">
                <span className="text-xs font-bold text-slate-600">ফিল্টার:</span>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="bg-transparent text-xs font-black text-slate-900 outline-none cursor-pointer"
                >
                  <option value="all">সকল ট্রানজেকশন ({statementData.length})</option>
                  <option value="STOCK_IN">🟢 স্টক ইন (Purchase)</option>
                  <option value="STOCK_OUT">🔴 স্টক আউট (Courier)</option>
                  <option value="RESTORED">🔵 স্টক রিস্টোর (Return/Cancel)</option>
                </select>
              </div>

              <button onClick={handleBulkDeleteStatement} className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-xl text-sm font-black hover:bg-rose-700 transition shadow-md cursor-pointer">
                <Trash2 className="w-4 h-4" /> সিলেক্টেড ডিলিট
              </button>
              <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-black transition shadow-md cursor-pointer">
                <Printer className="w-4 h-4" /> সিলেক্টেড প্রিন্ট ({printableData.length})
              </button>
              <button onClick={closePanel} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-6 md:p-10 flex-1 no-print">
            <div className="max-w-7xl mx-auto">
              {isLoadingStatement ? (
                <div className="text-center py-20 font-bold text-slate-500 animate-pulse text-base">লোড হচ্ছে...</div>
              ) : filteredStatement.length === 0 ? (
                <div className="text-center py-20 font-bold text-slate-400 text-base">কোনো ট্রানজেকশন রেকর্ড পাওয়া যায়নি।</div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-4 w-12 text-center">
                          <button onClick={toggleSelectAll} className="cursor-pointer text-slate-700">
                            {selectedRowIds.length === filteredStatement.length ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4" />}
                          </button>
                        </th>
                        <th className="px-5 py-4">তারিখ ও সময়</th>
                        <th className="px-5 py-4">ধরণ (Type)</th>
                        <th className="px-5 py-4">পার্টি বা কাস্টমার রেফারেন্স</th>
                        <th className="px-5 py-4">আইটেম নাম</th>
                        <th className="px-5 py-4 text-center">পরিমাণ</th>
                        <th className="px-5 py-4 text-right">রেট (৳)</th>
                        <th className="px-5 py-4 text-right">মোট দাম (৳)</th>
                        <th className="px-5 py-4 text-center">স্ট্যাটাস</th>
                        <th className="px-4 py-4 text-center w-20">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStatement.map((row) => {
                        const isSelected = selectedRowIds.includes(row.id);
                        const isPurchase = row.id.startsWith('pur-');
                        return (
                          <tr key={row.id} className={`hover:bg-slate-50 transition text-slate-900 ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                            <td className="px-4 py-4 text-center">
                              <button onClick={() => toggleSelectRow(row.id)} className="cursor-pointer text-slate-600">
                                {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                              </button>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-slate-600">
                              {row.date ? new Date(row.date).toLocaleString('en-GB') : 'N/A'}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              {row.type === 'STOCK_IN' && (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-[11px] font-black">
                                  <ArrowDownLeft className="w-3.5 h-3.5" /> STOCK IN
                                </span>
                              )}
                              {row.type === 'STOCK_OUT' && (
                                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2.5 py-1 rounded-md text-[11px] font-black">
                                  <ArrowUpRight className="w-3.5 h-3.5" /> STOCK OUT
                                </span>
                              )}
                              {row.type === 'RESTORED' && (
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md text-[11px] font-black">
                                  <RotateCcw className="w-3.5 h-3.5" /> RESTORED
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 font-black text-xs text-slate-800">{row.reference}</td>
                            <td className="px-5 py-4 text-xs font-bold text-slate-700">{row.itemName}</td>
                            <td className="px-5 py-4 text-center">
                              <span className={`px-3 py-1.5 rounded-lg font-black text-xs border shadow-sm ${row.type === 'STOCK_OUT' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                                {row.type === 'STOCK_OUT' ? `-${row.quantity}` : `+${row.quantity}`} পিস
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-xs font-bold text-slate-600">
                              {row.rate > 0 ? `৳ ${row.rate}` : '-'}
                            </td>
                            <td className="px-5 py-4 text-right font-black text-slate-800 font-mono text-sm">
                              {row.total > 0 ? `৳ ${row.total}` : '-'}
                            </td>
                            <td className="px-5 py-4 text-center text-xs font-bold text-slate-600">
                              {row.statusText}
                            </td>
                            <td className="px-4 py-4 text-center">
                              {isPurchase ? (
                                <button
                                  onClick={() => handleDeleteStatementRow(row.id)}
                                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                                  title="ডিলিট করুন"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div id="printable-invoice" className="hidden text-black bg-white w-full p-4">
            <div className="text-center mb-6 border-b-2 border-slate-800 pb-4">
              <h1 className="text-2xl font-black uppercase tracking-wider">BLACK ROCK CORPORATION</h1>
              <p className="text-xs font-bold text-slate-600 mt-0.5">Ruhama Wear | Stock Statement & Ledger</p>
              <p className="text-[11px] font-bold text-slate-500 mt-1">প্রিন্টের তারিখ: {new Date().toLocaleDateString('en-GB')}</p>
              {selectedTypeFilter !== 'all' && <p className="text-xs font-black text-indigo-700 mt-1">ফিল্টার ধরণ: {selectedTypeFilter}</p>}
            </div>

            <table>
              <thead>
                <tr>
                  <th>তারিখ ও সময়</th>
                  <th>ধরণ</th>
                  <th>রেফারেন্স (পার্টি/কাস্টমার)</th>
                  <th>আইটেম নাম</th>
                  <th style={{ textAlign: 'center' }}>পরিমাণ</th>
                  <th style={{ textAlign: 'right' }}>রেট (৳)</th>
                  <th style={{ textAlign: 'right' }}>মোট দাম (৳)</th>
                </tr>
              </thead>
              <tbody>
                {printableData.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date ? new Date(row.date).toLocaleString('en-GB') : 'N/A'}</td>
                    <td><b>{row.type}</b></td>
                    <td>{row.reference}</td>
                    <td>{row.itemName}</td>
                    <td style={{ textAlign: 'center' }}>{row.type === 'STOCK_OUT' ? `-${row.quantity}` : `+${row.quantity}`} পিস</td>
                    <td style={{ textAlign: 'right' }}>{row.rate > 0 ? row.rate : '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{row.total > 0 ? row.total : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>
              <p>সর্বমোট পারচেজ খরচ (Grand Total Cost): <span style={{ color: '#047857', fontSize: '16px' }}>৳ {grandTotalCost}</span></p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}