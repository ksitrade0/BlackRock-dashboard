import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // ১. পারচেজ টেবিল না থাকলে স্বয়ংক্রিয়ভাবে তৈরি হবে[cite: 7]
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

    // ২. অর্ডার টেবিল না থাকলে স্বয়ংক্রিয়ভাবে তৈরি হবে[cite: 7]
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        store_id VARCHAR(50),
        invoice VARCHAR(100),
        customer_name VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        district VARCHAR(100),
        thana VARCHAR(100),
        size VARCHAR(50),
        total DECIMAL(10,2),
        status VARCHAR(50),
        items TEXT,
        tracking_code VARCHAR(255),
        consignment_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(255)");
    await query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS consignment_id VARCHAR(255)");

    const purchases: any = await query("SELECT item_name, quantity FROM purchases");[cite: 7]
    const orders: any = await query(`
      SELECT items FROM orders 
      WHERE ((tracking_code IS NOT NULL AND tracking_code != '') OR (consignment_id IS NOT NULL AND consignment_id != '')) 
      AND status != 'cancelled' 
      AND status != 'failed'
    `);[cite: 7]

    let liveStock: Record<string, number> = {};

    // কেনা প্রোডাক্ট যোগ (+)[cite: 7]
    if (Array.isArray(purchases)) {
      purchases.forEach((p: any) => {
        const itemName = p.item_name ? p.item_name.toString().trim() : '';
        if (itemName) {
          if (!liveStock[itemName]) liveStock[itemName] = 0;
          liveStock[itemName] += Number(p.quantity || 0);
        }
      });
    }

    // কুরিয়ারে পাঠানো প্রোডাক্ট বিয়োগ (-)[cite: 7]
    if (Array.isArray(orders)) {
      orders.forEach((o: any) => {
        if (o.items) {
          const itemsArr = o.items.split(',').map((s: string) => s.trim()).filter(Boolean);
          itemsArr.forEach((itemName: string) => {
            const cleanItem = itemName.trim();
            if (liveStock[cleanItem] !== undefined) {
              liveStock[cleanItem] -= 1;
            } else {
              const matchedKey = Object.keys(liveStock).find(k => k.toLowerCase() === cleanItem.toLowerCase());
              if (matchedKey) {
                liveStock[matchedKey] -= 1;
              }
            }
          });
        }
      });
    }

    return NextResponse.json(liveStock);
  } catch (error: any) {
    console.error('Live Stock API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}