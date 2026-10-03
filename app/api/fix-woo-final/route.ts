export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const stores = [
      {
        url: process.env.STORE1_URL || 'https://ruhamawear.com',
        key: process.env.STORE1_KEY || '',
        secret: process.env.STORE1_SECRET || '',
        storeId: 'store1'
      },
      {
        url: process.env.STORE2_URL || 'https://aasthanaturalsbd.com',
        key: process.env.STORE2_KEY || '',
        secret: process.env.STORE2_SECRET || '',
        storeId: 'store2'
      }
    ];

    let totalFixed = 0;
    const logs: string[] = [];

    for (const store of stores) {
      if (!store.url || !store.key || !store.secret) continue;
      const cleanUrl = store.url.replace(/\/$/, '');
      const authHeader = 'Basic ' + Buffer.from(`${store.key}:${store.secret}`).toString('base64');

      // উকমার্স থেকে রিয়েল অর্ডারগুলো ফেচ করছি (সর্বোচ্চ ১০০টি)
      const wooRes = await fetch(`${cleanUrl}/wp-json/wc/v3/orders?per_page=100&orderby=date&order=desc`, {
        headers: { Authorization: authHeader }
      });

      if (!wooRes.ok) continue;
      const wooOrders = await wooRes.json();

      for (const wooOrder of wooOrders) {
        const orderId = wooOrder.id;
        const currentTotal = parseFloat(wooOrder.total || '0');

        // যদি টোটাল অস্বাভাবিক বেশি হয় (> 2500) অথবা উকমার্সে অতিরিক্ত fee_lines থাকে
        if (currentTotal > 2500 || (wooOrder.fee_lines && wooOrder.fee_lines.length > 0)) {
          
          // শুধুমাত্র প্রোডাক্টের আসল দাম (line_items) এবং শিপিং যোগ করে আসল টোটাল বের করা
          let trueTotal = 0;
          if (wooOrder.line_items) {
            wooOrder.line_items.forEach((item: any) => {
              trueTotal += parseFloat(item.total || '0');
            });
          }
          if (wooOrder.shipping_lines) {
            wooOrder.shipping_lines.forEach((item: any) => {
              trueTotal += parseFloat(item.total || '0');
            });
          }

          if (trueTotal > 0 && trueTotal < currentTotal) {
            // ১. উকমার্সে রিকোয়েস্ট পাঠিয়ে সমস্ত ভুল ফি (fee_lines) ফাকা করব এবং আসল টোটাল সেট করব
            const updateWooRes = await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: authHeader },
              body: JSON.stringify({
                fee_lines: [], // উকমার্সের সব জঞ্জাল ফি ডিলিট
                total: String(trueTotal) // উকমার্সে আসল দাম বসানো হলো
              })
            });

            if (updateWooRes.ok) {
              // ২. লোকাল ড্যাশবোর্ডের ডাটাবেজও আপডেট করে দেব
              try {
                await query("UPDATE orders SET total = ? WHERE id = ?", [String(trueTotal), orderId]);
              } catch (e) {}

              totalFixed++;
              logs.push(`Order #${orderId} fixed: ${currentTotal} -> ${trueTotal}`);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ WooCommerce সরাসরি ফিক্স করা হয়েছে! মোট ${totalFixed} টি অর্ডারের অতিরিক্ত ফি উকমার্স থেকে মুছে আসল দাম বসানো হয়েছে।`,
      logs
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}