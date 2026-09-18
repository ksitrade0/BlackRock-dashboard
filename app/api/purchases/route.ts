import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partyName, items } = body; // items হলো array: [{ itemName, quantity, buyingPrice }]

    for (const item of items) {
      // ১. পারচেজ রেকর্ড ডেটাবেজে সেভ করা
      await query(
        'INSERT INTO purchases (party_name, item_name, quantity, buying_price, created_at) VALUES (?, ?, ?, ?, NOW())',
        [partyName, item.itemName, item.quantity, item.buyingPrice]
      );

      // ২. মূল ইনভেন্টরি বা স্টক টেবিলে স্টক স্বয়ংক্রিয়ভাবে বাড়িয়ে দেওয়া
      await query(
        'UPDATE inventory SET stock = stock + ? WHERE item_name = ?',
        [item.quantity, item.itemName]
      );
    }

    return NextResponse.json({ success: true, message: 'Purchase added and stock updated successfully!' });
  } catch (error) {
    console.error('Error saving purchase:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Failed to save purchase' }, { status: 500 });
  }
}