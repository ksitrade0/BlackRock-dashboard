import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [purchases]: any = await query("SELECT item_name, quantity FROM purchases");
    const [orders]: any = await query("SELECT items FROM orders WHERE status != 'cancelled' AND status != 'failed'");

    let liveStock: Record<string, number> = {};

    // কেনা প্রোডাক্ট যোগ (+)
    purchases.forEach((p: any) => {
       if (!liveStock[p.item_name]) liveStock[p.item_name] = 0;
       liveStock[p.item_name] += Number(p.quantity);
    });

    // বিক্রি হওয়া প্রোডাক্ট বিয়োগ (-)
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

    return NextResponse.json(liveStock);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}