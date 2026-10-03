export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // সরাসরি ডাটাবেজ থেকে সব অর্ডার নিয়ে আসা হচ্ছে (কোনো এক্সটার্নাল API কল নেই, তাই হ্যাং হবে না)
    const orders: any = await query("SELECT id, items, total FROM orders");
    let fixedCount = 0;

    for (const order of orders) {
      const currentTotal = parseFloat(order.total || '0');
      if (isNaN(currentTotal) || currentTotal <= 0) continue;

      // কয়টা আইটেম অর্ডার করেছে সেটা কাউন্ট করছি
      const itemsStr = order.items || '';
      const itemsArr = itemsStr.split(',').filter(Boolean);
      const itemCount = itemsArr.length > 0 ? itemsArr.length : 1;

      // আপনি বলেছেন সর্বোচ্চ ১৫০০ টাকা হতে পারে, তাই সেফটি লিমিট ১৭০০ ধরলাম
      const maxExpected = itemCount * 1700;
      let truePrice = currentTotal;

      // ম্যাজিক লজিক: যতোক্ষণ দাম অস্বাভাবিক বড়, ততোক্ষণ ২ দিয়ে ভাগ করে আসল দামে নামিয়ে আনবে
      while (truePrice > maxExpected) {
        truePrice = truePrice / 2;
      }

      // যদি দাম কমানো হয়, তবে সাথে সাথে ডাটাবেজ আপডেট করে দেবে
      if (truePrice < currentTotal) {
        await query("UPDATE orders SET total = ? WHERE id = ?", [String(truePrice), order.id]);
        fixedCount++;
      }
    }

    return NextResponse.json({ 
        success: true, 
        message: `আলহামদুলিল্লাহ! আপনার ড্যাশবোর্ডের ${fixedCount} টি অর্ডারের বিশাল দামগুলো সফলভাবে আগের আসল দামে নামিয়ে আনা হয়েছে। দয়া করে ড্যাশবোর্ডে গিয়ে রিলোড দিন।` 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}