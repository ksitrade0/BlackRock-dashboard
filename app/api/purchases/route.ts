import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [rows]: any = await query('SELECT * FROM purchases ORDER BY id DESC');
    return NextResponse.json({ success: true, data: rows || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partyName, items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'সঠিক আইটেম পাওয়া যায়নি' }, { status: 400 });
    }

    for (const item of items) {
      await query(
        'INSERT INTO purchases (party_name, item_name, quantity, buying_price) VALUES (?, ?, ?, ?)',
        [partyName, item.itemName, item.quantity, item.buyingPrice]
      );
    }
    return NextResponse.json({ success: { success: true, message: 'পারচেজ সফলভাবে সেভ হয়েছে' } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}