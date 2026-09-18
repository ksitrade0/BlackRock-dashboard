'use client';
import { useState } from 'react';
import { Package, Plus, X, Save, User, ShoppingCart } from 'lucide-react';

export default function PurchaseManagement({ existingItems }: { existingItems: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { itemName: '', quantity: 1, buyingPrice: 0 }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const addItemRow = () => {
    setPurchaseItems([...purchaseItems, { itemName: '', quantity: 1, buyingPrice: 0 }]);
  };

  const removeItemRow = (indexToRemove: number) => {
    setPurchaseItems(purchaseItems.filter((_, index) => index !== indexToRemove));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...purchaseItems];
    (updated[index] as any)[field] = value;
    setPurchaseItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partyName, items: purchaseItems }),
      });
      
      const data = await res.json();

      if (res.ok) {
        alert('🎉 সফলভাবে স্টক ও পারচেজ যুক্ত হয়েছে!');
        setIsOpen(false);
        setPartyName('');
        setPurchaseItems([{ itemName: '', quantity: 1, buyingPrice: 0 }]);
        window.location.reload(); 
      } else {
        // ডেটাবেজে ঠিক কী সমস্যা হয়েছে সেটা এখানে দেখাবে
        alert(`❌ ডেটাবেজ এরর: ${data.error || 'অজানা সমস্যা'}\n\nআপনার .env ফাইল এবং ডেটাবেজ টেবিলের নামগুলো ঠিক আছে কি না চেক করুন।`);
      }
    } catch (error) {
      alert('❌ সার্ভারে কানেক্ট করা যাচ্ছে না!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* ইনভেন্টরি অ্যাড করার স্মার্ট বাটন */}
      <button 
        onClick={() => setIsOpen(true)}
        className="h-[36px] flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-black text-white px-4 rounded-lg font-bold text-xs transition border border-slate-800 shadow-2xs cursor-pointer active:scale-95"
      >
        <Package className="w-3.5 h-3.5 text-amber-400" /> + ইনভেন্টরি এন্ট্রি
      </button>

      {/* প্রিমিয়াম পপআপ মোডাল (Glassmorphism Effect) */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 transform transition-all">
            
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-100 p-1.5 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-wide uppercase">নতুন পারচেজ ও স্টক এন্ট্রি</h2>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {/* পার্টির নাম ইনপুট */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> কোন পার্টি থেকে কিনেছেন?
                </label>
                <input 
                  type="text" 
                  value={partyName} 
                  onChange={(e) => setPartyName(e.target.value)} 
                  placeholder="পার্টির নাম লিখুন (যেমন: Elbas Garments)" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 p-3 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  required 
                />
              </div>

              {partyName && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    আইটেমের বিবরণ ও দাম
                  </label>
                  
                  {/* আইটেম লিস্ট */}
                  <div className="space-y-3">
                    {purchaseItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center bg-white border border-slate-200 p-2 rounded-xl shadow-sm relative group transition-all hover:border-slate-300">
                        
                        {/* আইটেম ড্রপডাউন */}
                        <div className="flex-1">
                          <select 
                            value={item.itemName}
                            onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-lg p-2.5 outline-none focus:border-slate-900 cursor-pointer"
                            required
                          >
                            <option value="" className="text-slate-400 font-normal">-- আইটেম সিলেক্ট করুন --</option>
                            {existingItems.map((prod, i) => (
                              <option key={i} value={prod}>{prod}</option>
                            ))}
                          </select>
                        </div>

                        {/* পরিমাণ */}
                        <div className="w-24">
                          <input 
                            type="number" 
                            value={item.quantity || ''}
                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                            placeholder="পরিমাণ (Pcs)" 
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-lg p-2.5 outline-none focus:border-slate-900 text-center"
                            min="1"
                            required 
                          />
                        </div>

                        {/* দাম */}
                        <div className="w-32">
                          <input 
                            type="number" 
                            value={item.buyingPrice || ''}
                            onChange={(e) => handleItemChange(index, 'buyingPrice', Number(e.target.value))}
                            placeholder="কেনা দাম (৳)" 
                            className="w-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-black rounded-lg p-2.5 outline-none focus:border-emerald-500 text-center"
                            required 
                          />
                        </div>

                        {/* ডিলিট বাটন (একের অধিক আইটেম থাকলে দেখাবে) */}
                        {purchaseItems.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeItemRow(index)}
                            className="absolute -right-2 -top-2 bg-rose-100 text-rose-600 border border-rose-200 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-200 cursor-pointer shadow-sm"
                            title="আইটেমটি বাদ দিন"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* নতুন আইটেম যোগ করার বাটন */}
                  <button 
                    type="button" 
                    onClick={addItemRow}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 rounded-lg transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-700" /> আরেকটি আইটেম যোগ করুন
                  </button>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  বাতিল
                </button>
                {partyName && (
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer disabled:opacity-70 shadow-sm"
                  >
                    {isSaving ? (
                      <span className="animate-pulse">সেভ হচ্ছে...</span>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> পারচেজ সেভ করুন
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}