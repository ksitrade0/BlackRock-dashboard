import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const {
      storeId,
      orderId,
      status,
      staffName,
      customerName,
      phone,
      streetAddress,
      district,
      thana,
      size,
      items,
      total,
      action,
      trackingCode,
      consignmentId,
      courierStatus,
    } = body;

    let url = '';
    let key = '';
    let secret = '';

    const sId = String(storeId || '').toLowerCase();
    if (sId.includes('aastha') || sId === 'store2' || sId === '2') {
      url = process.env.STORE2_URL || 'https://aasthanaturalsbd.com';
      key = process.env.STORE2_KEY || '';
      secret = process.env.STORE2_SECRET || '';
    } else {
      url = process.env.STORE1_URL || 'https://ruhamawear.com';
      key = process.env.STORE1_KEY || '';
      secret = process.env.STORE1_SECRET || '';
    }

    if (!url || !key || !secret) {
      return NextResponse.json({ error: 'Store credentials missing' }, { status: 500 });
    }

    const cleanUrl = url.replace(/\/$/, '');
    const authHeader = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');

    // ডিলিট অ্যাকশন
    if (action === 'delete') {
      if (!orderId) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });

      const deleteRes = await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}?force=true`, {
        method: 'DELETE',
        headers: { Authorization: authHeader },
      });

      if (!deleteRes.ok) {
        const err = await deleteRes.json();
        return NextResponse.json({ error: err.message || 'Failed to delete' }, { status: deleteRes.status });
      }

      try {
        await query("DELETE FROM orders WHERE id = ?", [orderId]);
      } catch (e) {}

      return NextResponse.json({ success: true });
    }

    // =======================================================
    // 🛡️ CAPI ডুপ্লিকেট রোধ করার জন্য ডাটাবেজ থেকে আগের স্ট্যাটাস চেক
    // =======================================================
    let oldStatus = '';
    if (orderId) {
      try {
        const oldRows: any = await query(`SELECT status FROM orders WHERE id = ? LIMIT 1`, [orderId]);
        if (oldRows && oldRows.length > 0) {
          oldStatus = (oldRows[0].status || '').toLowerCase();
        }
      } catch (e) {}
    }

    const nameParts = (customerName || '').trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';

    const billingShipping = {
      first_name: firstName,
      last_name: lastName,
      phone: phone || '',
      address_1: streetAddress || '',
      address_2: thana ? `Thana: ${thana}` : '',
      city: district || '',
      state: district || '',
      country: 'BD',
    };

    const metaData: any[] = [
      { key: '_processed_by_staff', value: staffName || 'Admin' },
      ...(size ? [{ key: 'size', value: size }, { key: 'সাইজ', value: size }] : []),
      ...(district ? [{ key: 'district', value: district }] : []),
      ...(thana ? [{ key: 'thana', value: thana }] : []),
      ...(trackingCode ? [{ key: 'trackingCode', value: String(trackingCode) }] : []),
      ...(consignmentId ? [{ key: 'consignmentId', value: String(consignmentId) }] : []),
      ...(courierStatus ? [{ key: 'courierStatus', value: String(courierStatus) }] : []),
    ];

    let finalOrderId = orderId;

    // নতুন অর্ডার তৈরির ক্ষেত্রে (POST)
    if (!orderId || Number(orderId) <= 0 || String(orderId).length > 10) {
      const createPayload: any = {
        payment_method: 'cod',
        payment_method_title: 'Cash on delivery',
        set_paid: false,
        status: status || 'processing',
        billing: billingShipping,
        shipping: billingShipping,
        meta_data: [
          ...metaData,
          { key: '_is_manual_dashboard_order', value: 'yes' }
        ],
      };

      const createRes = await fetch(`${cleanUrl}/wp-json/wc/v3/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(createPayload),
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        return NextResponse.json({ error: createData.message || 'Failed to create order' }, { status: createRes.status });
      }

      finalOrderId = createData.id;

      try {
        await query(
          `INSERT INTO orders (id, store_id, invoice, customer_name, phone, address, district, thana, size, total, status, items, tracking_code, consignment_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE tracking_code = VALUES(tracking_code), consignment_id = VALUES(consignment_id), status = VALUES(status), items = VALUES(items)`,
          [finalOrderId, storeId, String(finalOrderId), customerName, phone, streetAddress, district, thana, size, total || '0', status || 'processing', items || '', trackingCode || null, consignmentId || null]
        );
      } catch (dbErr) {}

      return NextResponse.json({ success: true, order: createData, isNew: true });
    }

    // পুরনো অর্ডার আপডেট (PUT)
    const updatePayload: any = {
      status: status || 'processing',
      total: String(total || '0'),
      billing: billingShipping,
      shipping: billingShipping,
      meta_data: metaData,
    };

    const res = await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(updatePayload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Update failed in WooCommerce' }, { status: res.status });
    }

    try {
      await query(
        `INSERT INTO orders (id, store_id, invoice, customer_name, phone, address, district, thana, size, total, status, items, tracking_code, consignment_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE tracking_code = VALUES(tracking_code), consignment_id = VALUES(consignment_id), status = VALUES(status), items = VALUES(items)`,
        [orderId, storeId, String(orderId), customerName, phone, streetAddress, district, thana, size, total || '0', status || 'processing', items || '', trackingCode || null, consignmentId || null]
      );
    } catch (dbErr) {}

    // =======================================================
    // 🚀 META CONVERSIONS API (CAPI) - MANUAL & FALLBACK
    // =======================================================
    const currentStatus = String(status || '').toLowerCase();
    
    // শর্ত: যদি আগের স্ট্যাটাস 'completed' না হয়ে থাকে এবং নতুন স্ট্যাটাস 'completed' হয়, তবেই পিক্সেল ফায়ার হবে
    if (oldStatus !== 'completed' && currentStatus === 'completed') {
        const PIXEL_ID = '1407475261571485';
        const ACCESS_TOKEN = 'EAAZBgIMx3nh0BSYfDyK54YtwjU7ejlxU0TrAc8tpakyOVPEatBs7kSOJKpnSlk06hoIZAaTxdfyUtOF7thgIUfifFAmvNQbUkEUpC2NakeRKZCSnlhCYPN5P4fXnn743W5xvOO9JohVloRjr2llm0Dh3k0fqp0ZByINexW9BbMh9VQgMP5kcZBG1oqDWuuQZDZD';
        
        const orderTotal = parseFloat(total || '0');
        const hashData = (hashStr: string) => {
            if (!hashStr) return '';
            return crypto.createHash('sha256').update(hashStr.replace(/[^0-9]/g, '')).digest('hex');
        };

        const capiPayload = {
            data: [{
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000),
                action_source: 'website',
                event_id: orderId.toString(),
                user_data: { ph: phone ? [hashData(phone)] : [] },
                custom_data: { currency: 'BDT', value: orderTotal }
            }]
        };

        try {
            await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(capiPayload)
            });
            console.log(`CAPI Purchase Event Sent for Order #${orderId} from Manual Update`);
        } catch (capiErr) {}
    }

    return NextResponse.json({ success: true, order: data });

  } catch (error: any) {
    console.error('Order update/create error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}