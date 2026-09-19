'use client';

import { useState } from 'react';
import { Lock, Package, History, X, Save, ShoppingCart, Printer, Plus, Trash2, UserCircle } from 'lucide-react';

export default function AdminInventoryPanel({ existingItems }: { existingItems: string[] }) {
  const [authTarget, setAuthTarget] = useState<'entry' | 'history' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [activePanel, setActivePanel] = useState<'entry' | 'history' | null>(null);

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [partyName, setPartyName] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([{ itemName: '', quantity: 1, buyingPrice: 0 }]);
  const [isSaving, setIsSaving] = useState(false);

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
        if (authTarget === 'history') {
          fetchHistory();
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

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/purchases');
      const data = await res.json();
      // ক্র্যাশ ফিক্স: ডেটা না পেলে খালি অ্যারে সেট করবে
      setHistoryData(data.data || []);
    } catch (err) {
      console.error(err);
      setHistoryData([]);
    } finally {
      setIsLoadingHistory(false);
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
        alert('✅ সফলভাবে স্টক যুক্ত হয়েছে!');
        closePanel();
        window.dispatchEvent(new Event('stockUpdated')); // লাইভ স্টক আপডেট ট্রিগার
      } else {
        alert('❌ ডেটাবেজ সেভ হতে সমস্যা হয়েছে: ' + (result.error || 'অজানা ত্রুটি'));
      }
    } catch (err) {
      alert('❌ নেটওয়ার্ক বা সার্ভার এরর!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePurchase = async (id: number) => {
    if (!confirm('সতর্কবার্তা! আপনি কি নিশ্চিত যে এই পারচেজটি ডিলিট করতে চান? (এটি ডিলিট করলে লাইভ স্টক থেকেও আইটেম কমে যাবে)')) return;
    try {
      const res = await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok && result.success) {
        alert('✅ পারচেজ সফলভাবে ডিলিট হয়েছে!');
        fetchHistory(); // টেবিল আপডেট
        window.dispatchEvent(new Event('stockUpdated')); // লাইভ স্টক অটো-আপডেট
      } else {
        alert('❌ ডিলিট হতে সমস্যা হয়েছে: ' + (result.error || 'অজানা ত্রুটি'));
      }
    } catch (err) {
      alert('❌ নেটওয়ার্ক বা সার্ভার এরর!');
    }
  };

  // স্মার্ট প্রিন্ট ফাংশন (খালি পেজ সমস্যা সমাধান)
  const handlePrint = () => {
    const printContent = document.getElementById('printable-invoice');
    if (!printContent) return;
    const styles = document.head.innerHTML; // Tailwind CSS কপি
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Purchase History Report</title>
            ${styles}
            <style>
              body { background-color: white !important; margin: 0; padding: 20px; color: black; }
              #printable-invoice { display: block !important; width: 100%; position: static !important; }
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
      alert('ব্রাউজারের পপ-আপ ব্লকার চালু আছে! দয়া করে উপরের ডানপাশ থেকে Allow করে আবার চেষ্টা করুন।');
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-48">
      {/* Main Dashboard Buttons */}
      <button
        onClick={() => setAuthTarget('entry')}
        className="w-full h-[36px] flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition shadow-2xs border border-slate-800 cursor-pointer"
      >
        <Package className="w-3.5 h-3.5 text-amber-400" /> ইনভেন্টরি এন্ট্রি
      </button>
      <button
        onClick={() => setAuthTarget('history')}
        className="w-full h-[36px] flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-bold transition shadow-2xs border border-slate-300 cursor-pointer"
      >
        <History className="w-3.5 h-3.5 text-indigo-600" /> পারচেজ হিস্ট্রি
      </button>

      {/* Auth Modal */}
      {authTarget && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleAuth} className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100">
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
        </div>
      )}

      {/* Premium Purchase Entry Modal */}
      {activePanel === 'entry' && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 text-left">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col no-print">
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 p-3 rounded-xl shadow-sm">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase text-slate-900 tracking-wide">পারচেজ ও ইনভেন্টরি এন্ট্রি</h2>
                  <p className="text-xs font-bold text-slate-500 mt-0.5"> সাপ্লায়ারের তথ্য এবং নতুন কাঁচামাল/প্রোডাক্ট যুক্ত করুন</p>
                </div>
              </div>
              <button onClick={closePanel} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-6 md:p-8 space-y-6">
              {/* Party Name Layout */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <UserCircle className="w-5 h-5 text-indigo-600" />
                  <label className="block text-sm font-black text-slate-800">সাপ্লায়ার বা পার্টির নাম</label>
                </div>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="যেমন: রহিম ভাই (ফেব্রিক সাপ্লায়ার) পাইকারি মার্কেট..."
                  className="w-full border border-slate-300 p-3.5 rounded-xl font-bold text-sm text-black focus:border-slate-900 outline-none bg-slate-50 transition"
                  required
                />
              </div>

              {/* Items Grid Layout */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 gap-3 p-4 border-b border-slate-200 bg-slate-100 text-[11px] font-black text-slate-600 uppercase tracking-wider text-center">
                  <div className="col-span-5 text-left pl-2">সাপ্লাইকৃত আইটেম / ম্যাটেরিয়াল</div>
                  <div className="col-span-3">পরিমাণ (পিস)</div>
                  <div className="col-span-3">কেনা দাম (প্রতি পিস ৳)</div>
                  <div className="col-span-1">বাদ</div>
                </div>

                <div className="p-4 space-y-3 bg-white">
                  {purchaseItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="col-span-5">
                        <select
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          className="w-full border border-slate-300 p-3 rounded-lg text-black font-bold text-xs outline-none bg-white focus:border-slate-900 cursor-pointer"
                          required
                        >
                          <option value="">-- ড্রপডাউন থেকে আইটেম সিলেক্ট করুন</option>
                          {existingItems.map((prod, i) => <option key={i} value={prod}>{prod}</option>)}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          placeholder="পরিমাণ লিখুন"
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
                          title="আইটেমটি বাদ দিন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPurchaseItems([...purchaseItems, { itemName: '', quantity: 1, buyingPrice: 0 }])}
                    className="mt-2 flex items-center justify-center gap-1.5 w-full border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl transition cursor-pointer text-xs"
                  >
                    <Plus className="w-4 h-4" /> নতুন আরেকটি আইটেম যোগ করুন
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
        </div>
      )}

      {/* Premium Purchase History Modal */}
      {activePanel === 'history' && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 text-left">
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center no-print">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 p-3 rounded-xl shadow-sm">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase text-slate-900 tracking-wide">পারচেজ হিস্ট্রি ও রিপোর্ট</h2>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">সকল পারচেজ রেকর্ড এবং লেনদেন সমূহ</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-black transition shadow-md cursor-pointer">
                  <Printer className="w-4 h-4" /> A4 প্রিন্ট / PDF
                </button>
                <button onClick={closePanel} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-6 flex-1 bg-slate-100/50 no-print">
              {isLoadingHistory ? (
                <div className="text-center py-20 font-bold text-slate-500 animate-pulse text-base"> লোড হচ্ছে...</div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-20 font-bold text-slate-400 text-base"> কোনো পারচেজ হিস্ট্রি পাওয়া যায়নি।</div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">তারিখ</th>
                        <th className="px-6 py-4">পার্টির নাম (সাপ্লায়ার)</th>
                        <th className="px-6 py-4">আইটেম / প্রোডাক্ট</th>
                        <th className="px-6 py-4 text-center">পরিমাণ</th>
                        <th className="px-6 py-4 text-right">কেনা দাম (পিস)</th>
                        <th className="px-6 py-4 text-right">মোট দাম</th>
                        <th className="px-6 py-4 text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 transition text-slate-900">
                          {/* ক্র্যাশ ফিক্স: ডেট ফিল্ড চেক করা */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-600">
                            {row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 font-black text-xs text-slate-800">{row.party_name}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-700">{row.item_name}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg font-black text-xs border border-slate-200 shadow-sm">
                              {row.quantity} পিস
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs font-bold text-slate-600">৳ {row.buying_price}</td>
                          <td className="px-6 py-4 text-right font-black text-emerald-700 font-mono text-sm">
                            ৳ {Number(row.quantity) * Number(row.buying_price)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => handleDeletePurchase(row.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer" title="এই পারচেজটি ডিলিট করুন">
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Printable Area */}
            <div id="printable-invoice" className="hidden text-black bg-white w-full">
              <div className="text-center mb-8 border-b-2 border-slate-800 pb-5">
                <h1 className="text-3xl font-black uppercase tracking-wider">BLACK ROCK CORPORATION</h1>
                <p className="text-sm font-bold text-slate-600 mt-1">Ruhama Wear | Comprehensive Purchase History Report</p>
                <p className="text-xs font-bold text-slate-500 mt-1">রিপোর্ট প্রিন্টের তারিখ: {new Date().toLocaleDateString('en-GB')}</p>
              </div>
              <table className="w-full text-xs text-left border-collapse border border-slate-400">
                <thead className="bg-slate-100 uppercase font-black border-b border-slate-400">
                  <tr>
                    <th className="border-r border-slate-400 px-3 py-2.5">তারিখ</th>
                    <th className="border-r border-slate-400 px-3 py-2.5">পার্টির নাম</th>
                    <th className="border-r border-slate-400 px-3 py-2.5">আইটেম</th>
                    <th className="border-r border-slate-400 px-3 py-2.5 text-center">পরিমাণ</th>
                    <th className="border-r border-slate-400 px-3 py-2.5 text-right">কেনা দাম</th>
                    <th className="px-3 py-2.5 text-right">মোট দাম</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((row) => (
                    <tr key={row.id} className="border-b border-slate-300">
                      {/* ক্র্যাশ ফিক্স: ডেট ফিল্ড চেক করা */}
                      <td className="border-r border-slate-300 px-3 py-2.5">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : 'N/A'}
                      </td>
                      <td className="border-r border-slate-300 px-3 py-2.5 font-bold">{row.party_name}</td>
                      <td className="border-r border-slate-300 px-3 py-2.5">{row.item_name}</td>
                      <td className="border-r border-slate-300 px-3 py-2.5 text-center font-bold">{row.quantity}</td>
                      <td className="border-r border-slate-300 px-3 py-2.5 text-right">{row.buying_price}</td>
                      <td className="px-3 py-2.5 text-right font-black">৳ {Number(row.quantity) * Number(row.buying_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}