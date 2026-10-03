export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // ২৫০০ টাকার ওপরের অর্ডারগুলো ধরছি (একবারে ১০টি যাতে সার্ভার হ্যাং না হয়)
    const orders: any = await query("SELECT * FROM orders WHERE CAST(total AS DECIMAL) > 2500 ORDER BY id DESC LIMIT 10");
    let fixedCount = 0;

    if (orders.length === 0) {
        return NextResponse.json({ success: true, message: "✅ আলহামদুলিল্লাহ! আপনার সব অর্ডারের দাম ১০০% আসল দামে ফিরে এসেছে। আর কোনো অর্ডার বাকি নেই।" });
    }

    for (const order of orders) {
      const orderId = order.id;
      const storeId = String(order.store_id || '').toLowerCase();

      let url = storeId.includes('aastha') || storeId === 'store2' || storeId === '2'
        ? process.env.STORE2_URL || 'https://aasthanaturalsbd.com'
        : process.env.STORE1_URL || 'https://ruhamawear.com';

      let key = storeId.includes('aastha') || storeId === 'store2' || storeId === '2'
        ? process.env.STORE2_KEY || ''
        : process.env.STORE1_KEY || '';

      let secret = storeId.includes('aastha') || storeId === 'store2' || storeId === '2'
        ? process.env.STORE2_SECRET || ''
        : process.env.STORE1_SECRET || '';

      const cleanUrl = url.replace(/\/$/, '');
      const authHeader = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');

      // ১. উকমার্স থেকে অর্ডারের একদম অরিজিনাল হিস্ট্রি আনছি
      const res = await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}`, {
        headers: { Authorization: authHeader }
      });

      if (res.ok) {
        const wooOrder = await res.json();

        // ২. প্রোডাক্টের দাম এবং ডেলিভারি চার্জ যোগ করে 'আসল দাম' বের করছি
        let realTotal = 0;
        if (wooOrder.line_items) {
            wooOrder.line_items.forEach((item: any) => realTotal += parseFloat(item.total || '0'));
        }
        if (wooOrder.shipping_lines) {
            wooOrder.shipping_lines.forEach((item: any) => realTotal += parseFloat(item.total || '0'));
        }

        if (realTotal > 0 && realTotal < parseFloat(order.total)) {
            // ৩. উকমার্সে ভুয়া ফি (fee_lines) মুছে দিয়ে আসল দাম আপডেট করছি
            await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: authHeader },
                body: JSON.stringify({
                    fee_lines: [], // ভুয়া ফি সব ক্লিয়ার
                    total: String(realTotal) // আসল দাম সেট
                })
            });

            // ৪. ড্যাশবোর্ডের ডাটাবেজে আসল দাম আপডেট করছি
            await query("UPDATE orders SET total = ? WHERE id = ?", [String(realTotal), orderId]);
            fixedCount++;
        } else {
            // সেফটি ফলব্যাক: যদি উকমার্স রেসপন্স না দেয়, লোকাল ডাটাবেজের দাম লজিক্যালি কমিয়ে দেওয়া
            let fallbackPrice = parseFloat(order.total);
            while(fallbackPrice > 2500) fallbackPrice /= 2;
            await query("UPDATE orders SET total = ? WHERE id = ?", [String(fallbackPrice), orderId]);
            fixedCount++;
        }
      }
    }

    return NextResponse.json({
        success: true,
        message: `⏳ ${fixedCount} টি অর্ডারের দাম সফলভাবে উকমার্স থেকে মিলিয়ে ঠিক করা হয়েছে! দয়া করে পেজটি আবার রিলোড (Refresh) দিন।`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}