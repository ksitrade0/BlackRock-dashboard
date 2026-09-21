import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const purchases: any = await query("SELECT item_name, quantity FROM purchases");
    // শুধুমাত্র কুরিয়ারে পাঠানো অর্ডারগুলো থেকে স্টক মাইনাস হবে
    const orders: any = await query("SELECT items FROM orders WHERE (tracking_code IS NOT NULL AND tracking_code != '') OR (consignment_id IS NOT NULL AND consignment_id != '')");

    let liveStock: Record<string, number> = {};

    // কেনা প্রোডাক্ট যোগ (+)
    if (Array.isArray(purchases)) {
      purchases.forEach((p: any) => {
        const itemName = p.item_name ? p.item_name.trim() : '';
        if (itemName) {
          if (!liveStock[itemName]) liveStock[itemName] = 0;
          liveStock[itemName] += Number(p.quantity || 0);
        }
      });
    }

    // কুরিয়ারে পাঠানো বিক্রি হওয়া প্রোডাক্ট বিয়োগ (-)
    if (Array.isArray(orders)) {
      orders.forEach((o: any) => {
        if (o.items) {
          const itemsArr = o.items.split(',').map((s: string) => s.trim()).filter(Boolean);
          itemsArr.forEach((itemName: string) => {
            if (liveStock[itemName] !== undefined) {
              liveStock[itemName] -= 1;
            }
          });
        }
      });
    }

    return NextResponse.json(liveStock);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}