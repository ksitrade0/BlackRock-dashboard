'use client';
import { useState } from 'react';

export default function PurchaseManagement({ existingItems }: { existingItems: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { itemName: '', quantity: 1, buyingPrice: 0 }
  ]);

  const addItemRow = () => {
    setPurchaseItems([...purchaseItems, { itemName: '', quantity: 1, buyingPrice: 0 }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...purchaseItems];
    updated[index][field as keyof typeof updated[0]] = value;
    setPurchaseItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partyName, items: purchaseItems }),
    });

    if (res.ok) {
      alert('সফলভাবে স্টক ও পারচেজ যুক্ত হয়েছে!');
      setIsOpen(false);
      setPartyName('');
      setPurchaseItems([{ itemName: '', quantity: 1, buyingPrice: 0 }]);
      window.location.reload(); // স্টক সাথে সাথে আপডেট দেখানোর জন্য
    } else {
      alert('সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    }
  };

  return (
    <div>
      {/* ইনভেন্টরি অ্যাড করার ছোট বাটন */}
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        + ইনভেন্টরি অ্যাড করুন
      </button>

      {/* পপআপ মোডাল */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-black">
            <h2 className="text-xl font-bold mb-4">পার্টি থেকে নতুন স্টক এন্ট্রি</h2>
            
            <form onSubmit={handleSubmit}>
              {/* পার্টির নাম ইনপুট */}
              <div className="mb-4">
                <label className="block font-medium mb-1">কোন পার্টি থেকে কিনেছেন?</label>
                <input 
                  type="text" 
                  value={partyName} 
                  onChange={(e) => setPartyName(e.target.value)} 
                  placeholder="পার্টির নাম লিখুন (যেমন: সুজন ভাই)" 
                  className="w-full border p-2 rounded"
                  required 
                />
              </div>

              {partyName && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">আইটেমের বিবরণ:</h3>
                  {purchaseItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      {/* ড্রপডাউন: ড্যাশবোর্ডের আসল আইটেম লিস্ট */}
                      <select 
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        className="border p-2 rounded flex-1"
                        required
                      >
                        <option value="">-- আইটেম সিলেক্ট করুন --</option>
                        {existingItems.map((prod, i) => (
                          <option key={i} value={prod}>{prod}</option>
                        ))}
                      </select>

                      <input 
                        type="number" 
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        placeholder="পরিমাণ" 
                        className="border p-2 rounded w-24"
                        min="1"
                        required 
                      />

                      <input 
                        type="number" 
                        value={item.buyingPrice}
                        onChange={(e) => handleItemChange(index, 'buyingPrice', Number(e.target.value))}
                        placeholder="কেনা দাম (প্রতি পিস)" 
                        className="border p-2 rounded w-36"
                        required 
                      />
                    </div>
                  ))}

                  <button 
                    type="button" 
                    onClick={addItemRow}
                    className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-black"
                  >
                    + আরেকটি আইটেম যোগ করুন
                  </button>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  বাতিল
                </button>
                {partyName && (
                  <button 
                    type="submit" 
                    className="bg-green-600 text-white px-4 py-2 rounded font-semibold"
                  >
                    পারচেজ সেভ করুন
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