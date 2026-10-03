import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const orders: any = await query("SELECT * FROM orders ORDER BY id DESC");
    let fixedCount = 0;

    for (const order of orders) {
      const orderId = order.id;
      const currentTotal = parseFloat(order.total || '0');
      const itemsString = order.items || '';
      
      // শুধুমাত্র ২৫০০ টাকার উপরের অস্বাভাবিক দামগুলো স্ক্যান করবে
      if (currentTotal > 2500) {
         let itemCount = itemsString ? itemsString.split(',').length : 1;
         if (itemCount === 0) itemCount = 1;
         
         // আইটেম অনুযায়ী সর্বোচ্চ লজিক্যাল দাম (প্রতি পিস ২০০০ টাকা ধরে)
         let maxValidPrice = itemCount * 2000; 
         let truePrice = currentTotal;
         
         // দাম ২ দিয়ে ভাগ হতে হতে আসল দামে (৯৯০/১৪৮৫/১৯৮০) এসে থেমে যাবে
         while (truePrice > maxValidPrice && truePrice % 2 === 0) {
             truePrice = truePrice / 2;
         }
         
         // আসল দাম খুঁজে পেলে ডাটাবেজ আপডেট করবে
         if (truePrice < currentTotal && truePrice >= 500) {
             await query("UPDATE orders SET total = ? WHERE id = ?", [truePrice, orderId]);
             fixedCount++;
         }
      }
    }

    return NextResponse.json({ 
        success: true, 
        message: `আলহামদুলিল্লাহ! আপনার ড্যাশবোর্ডের ${fixedCount} টি অর্ডারের বিশাল দামগুলো সফলভাবে আগের আসল দামে নামিয়ে আনা হয়েছে। দয়া করে ড্যাশবোর্ড রিলোড দিন।` 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}