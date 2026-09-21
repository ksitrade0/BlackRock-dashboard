import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // ডাটাবেজ কানেকশনের এনকোডিং এনসিওর করা
    await query("SET NAMES utf8mb4");

    // টেবিল তৈরি ও কলাম নিশ্চিত করা
    await query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        party_name VARCHAR(255),
        item_name VARCHAR(255),
        quantity INT,
        buying_price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

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
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    await query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(255)");
    await query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS consignment_id VARCHAR(255)");

    const purchases: any = await query("SELECT item_name, quantity FROM purchases");
    const orders: any = await query(`
      SELECT items FROM orders 
      WHERE ((tracking_code IS NOT NULL AND tracking_code != '') OR (consignment_id IS NOT NULL AND consignment_id != '')) 
      AND status != 'cancelled' 
      AND status != 'failed'
    `);

    let liveStock: Record<string, number> = {};

    // স্ট্রিং ক্লেনিং ফাংশন (বাংলা হাইফেন, স্পেস ও ইউনিকোড স্ট্যান্ডার্ড করার জন্য)
    const cleanStr = (str: string) => {
      if (!str) return '';
      return str.toString().trim().replace(/\s+/g, ' ').replace(/[–—]/g, '-');
    };

    // কেনা প্রোডাক্ট যোগ (+)
    if (Array.isArray(purchases)) {
      purchases.forEach((p: any) => {
        const rawName = p.item_name ? p.item_name.toString() : '';
        const itemName = cleanStr(rawName);
        if (itemName) {
          if (!liveStock[itemName]) liveStock[itemName] = 0;
          liveStock[itemName] += Number(p.quantity || 0);
        }
      });
    }

    // কুরিয়ারে পাঠানো প্রোডাক্ট বিয়োগ (-)
    if (Array.isArray(orders)) {
      orders.forEach((o: any) => {
        if (o.items) {
          const itemsArr = o.items.split(',').map((s: string) => cleanStr(s)).filter(Boolean);
          itemsArr.forEach((cleanItem: string) => {
            if (liveStock[cleanItem] !== undefined) {
              liveStock[cleanItem] -= 1;
            } else {
              // ফ্লেক্সিবল ম্যাচিং (কেস এবং স্পেস ইগ্নোর করে মেলানো)
              const matchedKey = Object.keys(liveStock).find(k => cleanStr(k).toLowerCase() === cleanItem.toLowerCase());
              if (matchedKey) {
                liveStock[matchedKey] -= 1;
              }
            }
          });
        }
      });
    }

    return NextResponse.json({ success: true, liveStock, rawPurchases: purchases });
  } catch (error: any) {
    console.error('Live Stock API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}