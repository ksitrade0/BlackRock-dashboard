import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// ডাটাবেজ টেবিল না থাকলে অটোমেটিক তৈরি করার সেফটি ফাংশন
const ensureTableExists = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      party_name VARCHAR(255),
      item_name VARCHAR(255),
      quantity INT,
      buying_price DECIMAL(10,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// পারচেজ হিস্ট্রি দেখার জন্য (GET)
export async function GET() {
  try {
    await ensureTableExists();
    const [rows]: any = await query('SELECT * FROM purchases ORDER BY id DESC');
    return NextResponse.json({ success: true, data: rows || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// নতুন পারচেজ সেভ করার জন্য (POST)
export async function POST(request: Request) {
  try {
    await ensureTableExists();
    const body = await request.json();
    const { partyName, items } = body;

    for (const item of items) {
      await query(
        'INSERT INTO purchases (party_name, item_name, quantity, buying_price) VALUES (?, ?, ?, ?)',
        [partyName, item.itemName, item.quantity, item.buyingPrice]
      );
    }
    return NextResponse.json({ success: true, message: 'পারচেজ সফলভাবে সেভ হয়েছে' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}