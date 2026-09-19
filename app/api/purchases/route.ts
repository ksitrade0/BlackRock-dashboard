import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// পারচেজ হিস্ট্রি দেখার জন্য (GET)
export async function GET() {
  try {
    const [rows]: any = await query('SELECT * FROM purchases ORDER BY created_at DESC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// নতুন পারচেজ সেভ করার জন্য (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partyName, items } = body;

    // প্রত্যেকটি আইটেম ডেটাবেজে সেভ করার লুপ
    for (const item of items) {
      await query(
        'INSERT INTO purchases (party_name, item_name, quantity, buying_price) VALUES (?, ?, ?, ?)',
        [partyName, item.itemName, item.quantity, item.buyingPrice]
      );
    }

    return NextResponse.json({ success: true, message: 'পারচেজ সফলভাবে সেভ হয়েছে' });
  } catch (error: any) {
    console.error('Purchase Entry Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}