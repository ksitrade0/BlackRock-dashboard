import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

      // লোকাল ডাটাবেজ থেকেও ডিলিট বা স্ট্যাটাস আপডেট করা যেতে পারে
      try {
        await query("DELETE FROM orders WHERE id = ?", [orderId]);
      } catch (e) {}

      return NextResponse.json({ success: true });
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

      // লোকাল ডাটাবেজে অর্ডার সংরক্ষণ
      try {
        await query(
          `INSERT INTO orders (id, store_id, invoice, customer_name, phone, address, district, thana, size, total, status, items, tracking_code, consignment_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE tracking_code = VALUES(tracking_code), consignment_id = VALUES(consignment_id), status = VALUES(status), items = VALUES(items)`,
          [finalOrderId, storeId, String(finalOrderId), customerName, phone, streetAddress, district, thana, size, total || '0', status || 'processing', items || '', trackingCode || null, consignmentId || null]
        );
      } catch (dbErr) {
        console.error('Local orders insert error:', dbErr);
      }

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

    // লোকাল ডাটাবেজে ট্র্যাকিং ও আইটেম আপডেট
    try {
      await query(
        `INSERT INTO orders (id, store_id, invoice, customer_name, phone, address, district, thana, size, total, status, items, tracking_code, consignment_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE tracking_code = VALUES(tracking_code), consignment_id = VALUES(consignment_id), status = VALUES(status), items = VALUES(items)`,
        [orderId, storeId, String(orderId), customerName, phone, streetAddress, district, thana, size, total || '0', status || 'processing', items || '', trackingCode || null, consignmentId || null]
      );
    } catch (dbErr) {
      console.error('Local orders update error:', dbErr);
    }

    return NextResponse.json({ success: true, order: data });

  } catch (error: any) {
    console.error('Order update/create error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}