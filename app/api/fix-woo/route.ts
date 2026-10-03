export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const stores = [
      {
        url: process.env.STORE1_URL || 'https://ruhamawear.com',
        key: process.env.STORE1_KEY || '',
        secret: process.env.STORE1_SECRET || '',
      },
      {
        url: process.env.STORE2_URL || 'https://aasthanaturalsbd.com',
        key: process.env.STORE2_KEY || '',
        secret: process.env.STORE2_SECRET || '',
      }
    ];

    let fixedCount = 0;
    const logs: string[] = [];

    for (const store of stores) {
      if (!store.url || !store.key || !store.secret) continue;
      const cleanUrl = store.url.replace(/\/$/, '');
      const authHeader = 'Basic ' + Buffer.from(`${store.key}:${store.secret}`).toString('base64');

      // উকমার্স থেকে লেটেস্ট ১০০টি অর্ডার আনছি
      const res = await fetch(`${cleanUrl}/wp-json/wc/v3/orders?per_page=100&orderby=date&order=desc`, {
        headers: { Authorization: authHeader }
      });

      if (!res.ok) continue;
      const orders = await res.json();

      for (const order of orders) {
        const orderId = order.id;
        const currentTotal = parseFloat(order.total || '0');

        // যদি অর্ডারে অতিরিক্ত ফি (fee_lines) থাকে অথবা টোটাল অস্বাভাবিক বেশি হয় (> 2500)
        if ((order.fee_lines && order.fee_lines.length > 0) || currentTotal > 2500) {
          
          // শুধু প্রোডাক্টের আসল দাম এবং শিপিং যোগ করে সঠিক টোটাল বের করা
          let trueTotal = 0;
          if (order.line_items) {
            order.line_items.forEach((item: any) => {
              trueTotal += parseFloat(item.total || '0');
            });
          }
          if (order.shipping_lines) {
            order.shipping_lines.forEach((item: any) => {
              trueTotal += parseFloat(item.total || '0');
            });
          }

          if (trueTotal > 0 && trueTotal < currentTotal) {
            // উকমার্সে রিকোয়েস্ট পাঠিয়ে ভুল ফি মুছে ফেলা এবং সঠিক টোটাল সেট করা
            const updateRes = await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: authHeader },
              body: JSON.stringify({
                fee_lines: [], // সমস্ত ভুল ফি ডিলিট
                total: String(trueTotal) // আসল দাম সেট
              })
            });

            if (updateRes.ok) {
              fixedCount++;
              logs.push(`Order #${orderId} cleaned: ${currentTotal} -> ${trueTotal}`);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ উকমার্সের সব ভুল ফি সফলভাবে মুছে ফেলা হয়েছে! মোট ${fixedCount} টি অর্ডার ঠিক করা হয়েছে।`,
      logs
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}