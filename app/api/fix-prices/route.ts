import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // ডাটাবেজ থেকে সব অর্ডার টেনে আনছি
    const orders: any = await query("SELECT * FROM orders ORDER BY id DESC");
    let fixedCount = 0;

    for (const order of orders) {
      const orderId = order.id;
      const storeId = order.store_id;
      const currentTotal = parseFloat(order.total || '0');

      if (currentTotal > 0) {
        let url = ''; let key = ''; let secret = '';
        if (storeId === 'store2' || storeId === '2' || String(storeId).includes('aastha')) {
          url = process.env.STORE2_URL || 'https://aasthanaturalsbd.com';
          key = process.env.STORE2_KEY || ''; secret = process.env.STORE2_SECRET || '';
        } else {
          url = process.env.STORE1_URL || 'https://ruhamawear.com';
          key = process.env.STORE1_KEY || ''; secret = process.env.STORE1_SECRET || '';
        }
        
        const cleanUrl = url.replace(/\/$/, '');
        const authHeader = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');

        // উকমার্স থেকে অর্ডারের হিস্ট্রি চেক করা হচ্ছে
        const res = await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}`, {
            headers: { Authorization: authHeader }
        });
        
        if (res.ok) {
            const wooOrder = await res.json();
            let truePrice = currentTotal;

            // যে বাগটির কারণে দাম বেড়েছিল, সেই 'Order Total' ফি-গুলো থেকে সবচেয়ে ছোট (আসল) দামটি খুঁজে বের করা হচ্ছে
            if (wooOrder.fee_lines && wooOrder.fee_lines.length > 0) {
                const orderTotalFees = wooOrder.fee_lines.filter((f: any) => f.name === 'Order Total');
                if (orderTotalFees.length > 0) {
                    const amounts = orderTotalFees.map((f: any) => parseFloat(f.total || '0')).filter((v: number) => v > 0);
                    if (amounts.length > 0) {
                        truePrice = Math.min(...amounts); // এটাই অর্ডারের আসল দাম
                    }
                }
            }

            // যদি আসল দাম বর্তমান বিশাল দামের চেয়ে কম হয়, তবে সেটা ঠিক করে দেওয়া হবে
            if (truePrice < currentTotal) {
                // ১. ড্যাশবোর্ডের ডাটাবেজ ঠিক করা
                await query("UPDATE orders SET total = ? WHERE id = ?", [truePrice, orderId]);
                
                // ২. উকমার্সের ডাটাবেজ ঠিক করা
                await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
                    body: JSON.stringify({ total: String(truePrice) })
                });
                
                fixedCount++;
            }
        }
      }
    }

    return NextResponse.json({ 
        success: true, 
        message: `আলহামদুলিল্লাহ! আপনার ড্যাশবোর্ডের ${fixedCount} টি অর্ডারের বিশাল দামগুলো সফলভাবে আগের আসল দামে নামিয়ে আনা হয়েছে।` 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}