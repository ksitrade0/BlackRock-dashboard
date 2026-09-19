import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// পারচেজ হিস্ট্রি ফেচ করার জন্য GET মেথড
export async function GET() {
  try {
    const rows = await query('SELECT * FROM purchases ORDER BY created_at DESC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Failed to fetch purchases' }, { status: 500 });
  }
}

// পারচেজ এন্ট্রি সেভ এবং স্টক আপডেট করার জন্য POST মেথড
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partyName, items } = body; 

    if (!partyName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'সঠিক পার্টির নাম ও আইটেম প্রদান করুন' }, { status: 400 });
    }

    for (const item of items) {
      if (!item.itemName || item.quantity === undefined || item.buyingPrice === undefined) {
        continue; // অসম্পূর্ণ আইটেম স্কিপ করবে
      }

      // ১. পারচেজ রেকর্ড ডেটাবেজে সেভ করা
      await query(
        'INSERT INTO purchases (party_name, item_name, quantity, buying_price, created_at) VALUES (?, ?, ?, ?, NOW())',
        [partyName, item.itemName, Number(item.quantity) || 0, Number(item.buyingPrice) || 0]
      );

      // ২. মূল ইনভেন্টরি বা স্টক টেবিলে স্টক স্বয়ংক্রিয়ভাবে বাড়িয়ে দেওয়া
      try {
        await query(
          'UPDATE inventory SET stock = stock + ? WHERE item_name = ?',
          [Number(item.quantity) || 0, item.itemName]
        );
      } catch (invErr) {
        console.error('Inventory Stock Update Warning:', invErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Purchase added and stock updated successfully!' });
  } catch (error) {
    console.error('Error saving purchase:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Failed to save purchase' }, { status: 500 });
  }
}