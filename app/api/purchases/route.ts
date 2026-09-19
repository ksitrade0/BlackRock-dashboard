import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// পারচেজ হিস্ট্রি ফেচ করার জন্য GET মেথড[cite: 9]
export async function GET() {
  try {
    const rows = await query('SELECT * FROM purchases ORDER BY created_at DESC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Failed to fetch purchases' }, { status: 500 });
  }
}

// পারচেজ এন্ট্রি সেভ এবং ইনভেন্টরি স্টক অ্যাড বা আপডেট করার জন্য POST মেথড[cite: 9]
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partyName, items } = body; 

    if (!partyName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'সঠিক পার্টির নাম ও আইটেম প্রদান করুন' }, { status: 400 });
    }

    for (const item of items) {
      if (!item.itemName || item.quantity === undefined || item.buyingPrice === undefined) {
        continue; // অসম্পূর্ণ আইটেম স্কিপ করবে[cite: 9]
      }

      const qty = Number(item.quantity) || 0;
      const price = Number(item.buyingPrice) || 0;

      // ১. পারচেজ রেকর্ড ডেটাবেজে সেভ করা[cite: 9]
      await query(
        'INSERT INTO purchases (party_name, item_name, quantity, buying_price, created_at) VALUES (?, ?, ?, ?, NOW())',
        [partyName, item.itemName, qty, price]
      );

      // ২. ইনভেন্টরি টেবিলে আইটেম আছে কিনা চেক করে নতুন অ্যাড বা স্টক আপডেট করা
      try {
        const existing: any = await query('SELECT * FROM inventory WHERE item_name = ?', [item.itemName]);
        
        if (existing && existing.length > 0) {
          // যদি আগে থেকেই থাকে, তবে স্টক যোগ হবে[cite: 9]
          await query(
            'UPDATE inventory SET stock = stock + ? WHERE item_name = ?',
            [qty, item.itemName]
          );
        } else {
          // যদি না থাকে, তবে ইনভেন্টরিতে নতুন আইটেম হিসেবে অ্যাড হবে
          await query(
            'INSERT INTO inventory (item_name, stock) VALUES (?, ?)',
            [item.itemName, qty]
          );
        }
      } catch (invErr) {
        console.error('Inventory Update Warning:', invErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Purchase added and inventory updated successfully!' });
  } catch (error) {
    console.error('Error saving purchase:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Failed to save purchase' }, { status: 500 });
  }
}