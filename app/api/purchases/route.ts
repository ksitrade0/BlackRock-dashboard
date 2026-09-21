import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
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
    const rows = await query("SELECT * FROM purchases ORDER BY id DESC");
    return NextResponse.json({ success: true, data: rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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

    const body = await req.json();
    const { partyName, items } = body;

    if (!partyName || !items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
    }

    for (const item of items) {
      if (item.itemName && item.quantity) {
        await query(
          "INSERT INTO purchases (party_name, item_name, quantity, buying_price) VALUES (?, ?, ?, ?)",
          [partyName, item.itemName, item.quantity, item.buyingPrice || 0]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}