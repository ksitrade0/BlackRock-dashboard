'use client';
import { useState, useEffect } from 'react';
import { Lock, Package, History, X, Save, ShoppingCart, User, Printer } from 'lucide-react';

export default function AdminInventoryPanel({ existingItems }: { existingItems: string[] }) {
  // States
  const [authTarget, setAuthTarget] = useState<'entry' | 'history' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [activePanel, setActivePanel] = useState<'entry' | 'history' | null>(null);
  
  // History States
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Entry States
  const [partyName, setPartyName] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([{ itemName: '', quantity: 1, buyingPrice: 0 }]);
  const [isSaving, setIsSaving] = useState(false);

  // --- Dynamic Password Verification (Cross-connected with your Login API) ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      // আপনার মেইন লগইন API ব্যবহার করা হচ্ছে
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      if (res.ok) {
        setActivePanel(authTarget);
        setAuthTarget(null);
        setPassword(''); 
        
        if (authTarget === 'history') {
          fetchHistory();
        }
      } else {
        alert('❌ ভুল ইউজারনেম বা পাসওয়ার্ড! আবার চেষ্টা করুন।');
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

  // --- Purchase History ---
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/purchases');
      const data = await res.json();
      if (data.success) {
        setHistoryData(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // --- Purchase Entry ---
  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...purchaseItems];
    (updated[index] as any)[field] = value;
    setPurchaseItems(updated);
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
      if (res.ok) {
        alert('🎉 সফলভাবে স্টক যুক্ত হয়েছে!');
        closePanel();
        window.location.reload(); 
      } else {
        alert('❌ ডেটাবেজ সেভ হতে সমস্যা হয়েছে।');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // --- Print Function ---
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Print CSS (Only applies when printing) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}} />

      {/* Header Buttons */}
      <button 
        onClick={() => setAuthTarget('entry')}
        className="flex items-center gap-1.5 bg-slate-800 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
      >
        <Package className="w-3.5 h-3.5 text-amber-400" /> ইনভেন্টরি এন্ট্রি
      </button>

      <button 
        onClick={() => setAuthTarget('history')}
        className="flex items-center gap-1.5 bg-slate-800 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
      >
        <History className="w-3.5 h-3.5 text-emerald-400" /> পারচেজ হিস্ট্রি
      </button>

      {/* 🔐 Dynamic Auth Modal */}
      {authTarget && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100]">
          <form onSubmit={handleAuth} className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex flex-col items-center mb-5">
              <div className="bg-rose-100 p-3 rounded-full mb-3">
                <Lock className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800">অ্যাডমিন ভেরিফিকেশন</h3>
              <p className="text-xs text-slate-500 mt-1 text-center">আপনার নিজের ড্যাশবোর্ড লগইন তথ্য দিন</p>
            </div>
            
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="আপনার ইউজারনেম"
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-center font-bold focus:ring-2 focus:ring-slate-800 outline-none mb-3 text-black"
              required
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="আপনার পাসওয়ার্ড"
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-center font-bold tracking-widest focus:ring-2 focus:ring-slate-800 outline-none mb-4 text-black"
              required
            />
            
            <div className="flex gap-2">
              <button type="button" onClick={() => setAuthTarget(null)} className="w-full py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition">
                বাতিল
              </button>
              <button type="submit" disabled={isVerifying} className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition flex items-center justify-center">
                {isVerifying ? 'চেক হচ্ছে...' : 'আনলক করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 📦 Purchase Entry Modal */}
      {activePanel === 'entry' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[90] p-4 text-left">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-black uppercase text-black">নতুন পারচেজ এন্ট্রি</h2>
              </div>
              <button onClick={closePanel} className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSavePurchase} className="p-5">
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-1">পার্টির নাম</label>
                <input type="text" value={partyName} onChange={(e) => setPartyName(e.target.value)} className="w-full border p-2.5 rounded-lg font-bold text-black" required />
              </div>

              <div className="space-y-3">
                {purchaseItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <select value={item.itemName} onChange={(e) => handleItemChange(index, 'itemName', e.target.value)} className="w-full border p-2.5 rounded-lg text-black font-bold flex-1" required>
                      <option value="">-- আইটেম সিলেক্ট করুন --</option>
                      {existingItems.map((prod, i) => <option key={i} value={prod}>{prod}</option>)}
                    </select>
                    <input type="number" value={item.quantity || ''} onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} placeholder="পরিমাণ" className="border p-2.5 rounded-lg w-24 text-center text-black font-bold" required />
                    <input type="number" value={item.buyingPrice || ''} onChange={(e) => handleItemChange(index, 'buyingPrice', Number(e.target.value))} placeholder="কেনা দাম ৳" className="border p-2.5 rounded-lg w-28 text-center text-black font-bold bg-emerald-50" required />
                  </div>
                ))}
                <button type="button" onClick={() => setPurchaseItems([...purchaseItems, { itemName: '', quantity: 1, buyingPrice: 0 }])} className="text-xs font-bold bg-slate-100 p-2 rounded-lg text-black hover:bg-slate-200">+ আইটেম যোগ করুন</button>
              </div>

              <div className="mt-6 flex justify-end">
                <button type="submit" disabled={isSaving} className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-700">
                  {isSaving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📜 Purchase History & Print PDF Modal */}
      {activePanel === 'history' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[90] p-4 text-left">
          
          {/* Main Modal UI */}
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col no-print">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-black uppercase text-black">পারচেজ হিস্ট্রি</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="flex items-center gap-1.5 bg-slate-900 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-black">
                  <Printer className="w-4 h-4" /> Print / PDF
                </button>
                <button onClick={closePanel} className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>
            
            <div className="overflow-y-auto p-4 flex-1 bg-slate-50">
              {isLoadingHistory ? (
                <div className="text-center py-10 font-bold text-slate-500 animate-pulse">লোড হচ্ছে...</div>
              ) : (
                <table className="w-full text-sm text-left border-collapse bg-white shadow-sm rounded-xl overflow-hidden">
                  <thead className="bg-slate-900 text-white uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">তারিখ</th>
                      <th className="px-4 py-3">পার্টির নাম</th>
                      <th className="px-4 py-3">আইটেম</th>
                      <th className="px-4 py-3 text-center">পরিমাণ</th>
                      <th className="px-4 py-3 text-right">কেনা দাম</th>
                      <th className="px-4 py-3 text-right">মোট দাম</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 text-black font-medium">
                        <td className="px-4 py-3 whitespace-nowrap">{new Date(row.created_at).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3 font-bold">{row.party_name}</td>
                        <td className="px-4 py-3">{row.item_name}</td>
                        <td className="px-4 py-3 text-center"><span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">{row.quantity}</span></td>
                        <td className="px-4 py-3 text-right">৳{row.buying_price}</td>
                        <td className="px-4 py-3 text-right font-black text-emerald-700">৳{Number(row.quantity) * Number(row.buying_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* 🖨️ A4 Printable Invoice Layout (Hidden until printed) */}
          <div id="printable-invoice" className="hidden text-black bg-white w-full">
            <div className="text-center mb-6 border-b pb-4">
              <h1 className="text-2xl font-black uppercase">BLACKROCK CORPORATION</h1>
              <p className="text-sm font-bold text-gray-600">Ruhama Wear | Purchase History Report</p>
              <p className="text-xs text-gray-500 mt-1">প্রিন্টের তারিখ: {new Date().toLocaleDateString('en-GB')}</p>
            </div>
            
            <table className="w-full text-sm text-left border-collapse border border-gray-300">
              <thead className="bg-gray-100 uppercase text-xs font-bold border-b border-gray-300">
                <tr>
                  <th className="border-r border-gray-300 px-3 py-2">তারিখ</th>
                  <th className="border-r border-gray-300 px-3 py-2">পার্টির নাম</th>
                  <th className="border-r border-gray-300 px-3 py-2">আইটেম</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center">পরিমাণ</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-right">কেনা দাম</th>
                  <th className="px-3 py-2 text-right">মোট দাম</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((row) => (
                  <tr key={row.id} className="border-b border-gray-200">
                    <td className="border-r border-gray-300 px-3 py-2">{new Date(row.created_at).toLocaleDateString('en-GB')}</td>
                    <td className="border-r border-gray-300 px-3 py-2 font-bold">{row.party_name}</td>
                    <td className="border-r border-gray-300 px-3 py-2">{row.item_name}</td>
                    <td className="border-r border-gray-300 px-3 py-2 text-center">{row.quantity}</td>
                    <td className="border-r border-gray-300 px-3 py-2 text-right">৳{row.buying_price}</td>
                    <td className="px-3 py-2 text-right font-bold">৳{Number(row.quantity) * Number(row.buying_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
        </div>
      )}
    </div>
  );
}