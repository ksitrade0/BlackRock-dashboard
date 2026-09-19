import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // ১. ডেটাবেজ থেকে পারচেজ (কেনা স্টক) এবং অর্ডার (বিক্রি) আনুন
    // (নোট: আপনার টেবিল বা কলামের নাম ভিন্ন হলে এখানে একটু মিলিয়ে নেবেন)
    const [purchases]: any = await pool.query("SELECT item_name, quantity FROM purchases");
    const [orders]: any = await pool.query("SELECT items FROM orders WHERE status != 'cancelled' AND status != 'failed'");

    let liveStock: Record<string, number> = {};

    // ২. কেনা প্রোডাক্টগুলো স্টকে যোগ (+) করা
    purchases.forEach((p: any) => {
       if (!liveStock[p.item_name]) liveStock[p.item_name] = 0;
       liveStock[p.item_name] += Number(p.quantity);
    });

    // ৩. বিক্রি হওয়া প্রোডাক্টগুলো স্টক থেকে বিয়োগ (-) করা
    orders.forEach((o: any) => {
       if (o.items) {
         // কমা দিয়ে আলাদা করা আইটেমগুলোকে ভাঙা
         const itemsArr = o.items.split(',').map((s: string) => s.trim()).filter(Boolean);
         itemsArr.forEach((itemName: string) => {
            if (liveStock[itemName] !== undefined) {
               liveStock[itemName] -= 1; // প্রতিটি অর্ডারের জন্য ১ পিস করে কমবে
            }
         });
       }
    });

    return NextResponse.json(liveStock);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}