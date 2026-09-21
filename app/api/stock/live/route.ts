import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // ডাটাবেজ টেবিলে ট্র্যাকিং কলাম নিশ্চিত করা
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

    // কেনা প্রোডাক্ট যোগ (+) - সমস্ত স্পেস ও কেস ট্রিম করে নিখুঁতভাবে যোগ করা
    if (Array.isArray(purchases)) {
      purchases.forEach((p: any) => {
        const itemName = p.item_name ? p.item_name.toString().trim() : '';
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
          const itemsArr = o.items.split(',').map((s: string) => s.trim()).filter(Boolean);
          itemsArr.forEach((itemName: string) => {
            const cleanItem = itemName.trim();
            if (liveStock[cleanItem] !== undefined) {
              liveStock[cleanItem] -= 1;
            } else {
              // যদি নামের স্ট্রিংয়ে সামান্য অমিল থাকে, কেস-ইনসেন্সিটিভ মিলিয়ে মাইনাস করা
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