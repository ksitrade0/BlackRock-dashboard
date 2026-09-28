import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const {
      storeId, orderId, status, staffName, customerName, phone, 
      streetAddress, district, thana, size, items, total, 
      action, trackingCode, consignmentId, courierStatus, dateSent
    } = body;

    let url = ''; let key = ''; let secret = '';
    const sId = String(storeId || '').toLowerCase();
    
    if (sId.includes('aastha') || sId === 'store2' || sId === '2') {
      url = process.env.STORE2_URL || 'https://aasthanaturalsbd.com';
      key = process.env.STORE2_KEY || ''; secret = process.env.STORE2_SECRET || '';
    } else {
      url = process.env.STORE1_URL || 'https://ruhamawear.com';
      key = process.env.STORE1_KEY || ''; secret = process.env.STORE1_SECRET || '';
    }

    if (!url || !key || !secret) return NextResponse.json({ error: 'Credentials missing' }, { status: 500 });

    const cleanUrl = url.replace(/\/$/, '');
    const authHeader = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');

    if (action === 'delete') {
      if (!orderId) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
      await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}?force=true`, { method: 'DELETE', headers: { Authorization: authHeader } });
      try { await query("DELETE FROM orders WHERE id = ?", [orderId]); } catch (e) {}
      return NextResponse.json({ success: true });
    }

    let oldStatus = '';
    try {
      const oldRows: any = await query(`SELECT status FROM orders WHERE id = ? LIMIT 1`, [orderId]);
      if (oldRows && oldRows.length > 0) oldStatus = (oldRows[0].status || '').toLowerCase();
    } catch (e) {}

    const nameParts = (customerName || '').trim().split(' ');
    const billingShipping = {
      first_name: nameParts[0] || 'Customer',
      last_name: nameParts.slice(1).join(' ') || '',
      phone: phone || '',
      address_1: streetAddress || '',
      address_2: thana ? `Thana: ${thana}` : '',
      city: district || '',
      state: district || '',
      country: 'BD',
    };

    const metaData: any[] = [
      { key: '_processed_by_staff', value: staffName || 'Admin' },
      { key: 'custom_dashboard_items', value: String(items || '') }, 
      ...(size ? [{ key: 'size', value: size }] : []),
      ...(district ? [{ key: 'district', value: district }] : []),
      ...(thana ? [{ key: 'thana', value: thana }] : []),
      ...(trackingCode ? [{ key: 'trackingCode', value: String(trackingCode) }] : []),
      ...(consignmentId ? [{ key: 'consignmentId', value: String(consignmentId) }] : []),
      ...(courierStatus ? [{ key: 'courierStatus', value: String(courierStatus) }] : []),
      ...(dateSent ? [{ key: 'dateSent', value: String(dateSent) }] : []),
    ];

    let finalOrderId = orderId;
    let createData: any = null;
    let isNew = false;

    if (!orderId || Number(orderId) <= 0 || String(orderId).length > 10) {
      isNew = true;
      const createRes = await fetch(`${cleanUrl}/wp-json/wc/v3/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({
          payment_method: 'cod', payment_method_title: 'Cash on delivery', set_paid: false,
          status: status || 'on-hold', billing: billingShipping, shipping: billingShipping,
          meta_data: [...metaData, { key: '_is_manual_dashboard_order', value: 'yes' }]
        }),
      });
      createData = await createRes.json();
      finalOrderId = createData.id;
    } else {
      await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({ status: status || 'on-hold', total: String(total || '0'), billing: billingShipping, shipping: billingShipping, meta_data: metaData }),
      });
    }

    try { await query(`ALTER TABLE orders ADD COLUMN items TEXT`); } catch(e) {}
    try { await query(`ALTER TABLE orders ADD COLUMN store_id VARCHAR(50)`); } catch(e) {}

    try {
      await query(
        `INSERT INTO orders (id, store_id, invoice, customer_name, phone, address, district, thana, size, total, status, items, tracking_code, consignment_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE tracking_code = VALUES(tracking_code), consignment_id = VALUES(consignment_id), status = VALUES(status), items = VALUES(items)`,
        [finalOrderId, storeId, String(finalOrderId), customerName, phone, streetAddress, district, thana, size, total || '0', status || 'on-hold', items || '', trackingCode || null, consignmentId || null]
      );
    } catch (dbErr) {
      try {
        await query(`UPDATE orders SET items = ?, status = ? WHERE id = ?`, [items || '', status || 'on-hold', finalOrderId]);
      } catch(fallbackErr) {}
    }

    const currentStatus = String(status || '').toLowerCase();
    if (oldStatus !== 'completed' && currentStatus === 'completed') {
        const PIXEL_ID = '1407475261571485';
        const ACCESS_TOKEN = 'EAAZBgIMx3nh0BSYfDyK54YtwjU7ejlxU0TrAc8tpakyOVPEatBs7kSOJKpnSlk06hoIZAaTxdfyUtOF7thgIUfifFAmvNQbUkEUpC2NakeRKZCSnlhCYPN5P4fXnn743W5xvOO9JohVloRjr2llm0Dh3k0fqp0ZByINexW9BbMh9VQgMP5kcZBG1oqDWuuQZDZD';
        const orderTotal = parseFloat(total || '0');
        const hashData = (hashStr: string) => hashStr ? crypto.createHash('sha256').update(hashStr.replace(/[^0-9]/g, '')).digest('hex') : '';
        try {
            await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [{ event_name: 'Purchase', event_time: Math.floor(Date.now() / 1000), action_source: 'website', event_id: finalOrderId.toString(), user_data: { ph: phone ? [hashData(phone)] : [] }, custom_data: { currency: 'BDT', value: orderTotal } }] })
            });
        } catch (capiErr) {}
    }

    return NextResponse.json({ success: true, order: createData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}