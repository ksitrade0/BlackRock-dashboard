import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // একবারে ১৫টি অর্ডার ধরবে যাতে সার্ভার টাইমআউট না হয় (শুধুমাত্র ২০০০ টাকার উপরের ভুল দামগুলো)
    const orders: any = await query("SELECT * FROM orders WHERE CAST(total AS DECIMAL) > 2000 ORDER BY id DESC LIMIT 15");
    let fixedCount = 0;

    if (orders.length === 0) {
        return NextResponse.json({ success: true, message: "আলহামদুলিল্লাহ! আর কোনো অর্ডারের দাম ঠিক করার বাকি নেই। সব ঠিক হয়ে গেছে!" });
    }

    for (const order of orders) {
      const orderId = order.id;
      const storeId = order.store_id;

      let url = storeId === 'store2' || storeId === '2' || String(storeId).includes('aastha')
        ? process.env.STORE2_URL || 'https://aasthanaturalsbd.com'
        : process.env.STORE1_URL || 'https://ruhamawear.com';
      let key = storeId === 'store2' || storeId === '2' || String(storeId).includes('aastha')
        ? process.env.STORE2_KEY || ''
        : process.env.STORE1_KEY || '';
      let secret = storeId === 'store2' || storeId === '2' || String(storeId).includes('aastha')
        ? process.env.STORE2_SECRET || ''
        : process.env.STORE1_SECRET || '';
        
      const cleanUrl = url.replace(/\/$/, '');
      const authHeader = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');

      // উকমার্স থেকে অর্ডারের আসল হিস্ট্রি টেনে আনা হচ্ছে
      const res = await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}`, { headers: { Authorization: authHeader } });
      
      if (res.ok) {
          const wooOrder = await res.json();
          let wooOriginalPrice = 0;

          if (wooOrder.fee_lines && wooOrder.fee_lines.length > 0) {
              // যেই প্রথম দামটা ড্যাশবোর্ড থেকে পাঠানো হয়েছিল, সেটা খুঁজে বের করা
              const amounts = wooOrder.fee_lines.map((f: any) => parseFloat(f.total || '0')).filter((v: number) => v > 0);
              if (amounts.length > 0) {
                  wooOriginalPrice = amounts[0]; // প্রথম লাইনটাই আসল দাম (যেমন: 990, 1485)
              }
              
              if (wooOriginalPrice > 0 && wooOriginalPrice < parseFloat(order.total)) {
                  // উকমার্সের ভুল ফি-গুলোকে জিরো (0) করে দেওয়া
                  const resetFeeLines = wooOrder.fee_lines.map((f: any) => ({
                     id: f.id,
                     total: "0",
                     total_tax: "0"
                  }));
                  
                  // শুধু একটি আসল দামের ফি যুক্ত করা
                  resetFeeLines.push({
                     name: "Order Total (Fixed)",
                     total: String(wooOriginalPrice)
                  });

                  // উকমার্সে সঠিক দাম আপডেট করা
                  await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
                    body: JSON.stringify({ 
                        fee_lines: resetFeeLines, 
                        total: String(wooOriginalPrice) 
                    })
                  });

                  // আপনার ড্যাশবোর্ডের ডাটাবেজ আপডেট করা
                  await query("UPDATE orders SET total = ? WHERE id = ?", [wooOriginalPrice, orderId]);
                  fixedCount++;
              }
          }
      }
    }

    return NextResponse.json({ 
        success: true, 
        message: `${fixedCount} টি অর্ডারের দাম সফলভাবে ঠিক করা হয়েছে! যদি আরও অর্ডার বাকি থাকে, তবে এই পেজটি আবার রিলোড (Refresh) দিন।` 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}