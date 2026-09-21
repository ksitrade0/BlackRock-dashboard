import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // টেবিলগুলো নিশ্চিত করা
    await query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        party_name VARCHAR(255),
        item_name VARCHAR(255),
        quantity INT,
        buying_price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        store_id VARCHAR(50),
        invoice VARCHAR(100),
        customer_name VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        district VARCHAR(100),
        thana VARCHAR(100),
        size VARCHAR(50),
        total DECIMAL(10,2),
        status VARCHAR(50),
        items TEXT,
        tracking_code VARCHAR(255),
        consignment_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // পারচেজ থেকে স্টক ইন ডেটা আনা
    const purchases: any = await query("SELECT id, party_name, item_name, quantity, buying_price, created_at FROM purchases");
    // অর্ডার থেকে স্টক আউট ও রিস্টোর ডেটা আনা
    const orders: any = await query("SELECT id, customer_name, items, status, tracking_code, consignment_id, created_at FROM orders");

    let ledger: any[] = [];

    // ১. স্টক ইন (Purchases)
    if (Array.isArray(purchases)) {
      purchases.forEach((p: any) => {
        ledger.push({
          id: `pur-${p.id}`,
          date: p.created_at,
          type: 'STOCK_IN',
          reference: p.party_name || 'সাপ্লায়ার',
          itemName: p.item_name,
          quantity: Number(p.quantity),
          rate: Number(p.buying_price || 0),
          total: Number(p.quantity) * Number(p.buying_price || 0),
          statusText: 'সফলভাবে ইনভেন্টরি এন্ট্রি (Stock In)'
        });
      });
    }

    // ২. স্টক আউট ও রিস্টোর (Orders)
    if (Array.isArray(orders)) {
      orders.forEach((o: any) => {
        if (o.items) {
          const itemsArr = o.items.split(',').map((s: string) => s.trim()).filter(Boolean);
          const isShipped = (o.tracking_code && o.tracking_code !== '') || (o.consignment_id && o.consignment_id !== '');
          const isCancelled = o.status === 'cancelled' || o.status === 'failed';

          itemsArr.forEach((item: string) => {
            if (isShipped && !isCancelled) {
              ledger.push({
                id: `ord-out-${o.id}-${item}`,
                date: o.created_at,
                type: 'STOCK_OUT',
                reference: `অর্ডার #${o.id} (${o.customer_name || 'কাস্টমার'})`,
                itemName: item,
                quantity: 1,
                rate: 0,
                total: 0,
                statusText: 'কুরিয়ারে প্রেরিত (Send to Steadfast)'
              });
            } else if (isCancelled && isShipped) {
              ledger.push({
                id: `ord-res-${o.id}-${item}`,
                date: o.created_at,
                type: 'RESTORED',
                reference: `অর্ডার #${o.id} (${o.customer_name || 'কাস্টমার'})`,
                itemName: item,
                quantity: 1,
                rate: 0,
                total: 0,
                statusText: 'কেন্সেল/ফেরত হওয়ায় স্টক রিস্টোর'
              });
            }
          });
        }
      });
    }

    // তারিখ অনুযায়ী ডিসেন্ডিং অর্ডারে সাজানো (নতুনগুলো উপরে)
    ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ success: true, data: ledger });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}