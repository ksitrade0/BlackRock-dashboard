import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      storeId,
      customerName,
      phone,
      streetAddress,
      district,
      thana,
      items,
      size,
      total,
      staffName,
    } = body;

    if (!customerName || !phone || !total) {
      return NextResponse.json({ error: 'Customer Name, Phone and Total are required' }, { status: 400 });
    }

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

    const nameParts = customerName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const billingShipping = {
      first_name: firstName,
      last_name: lastName,
      address_1: streetAddress || '',
      address_2: thana ? `Thana: ${thana}` : '',
      city: district || '',
      state: district || '',
      phone: phone,
      country: 'BD',
    };

    const newOrderPayload: any = {
      payment_method: 'cod',
      payment_method_title: 'Cash on delivery (Manual Dashboard)',
      set_paid: false,
      status: 'processing',
      billing: billingShipping,
      shipping: billingShipping,
      line_items: [
        {
          name: items || 'Custom Order Item',
          quantity: 1,
          total: String(total),
        },
      ],
      meta_data: [
        { key: '_processed_by_staff', value: staffName || 'Admin' },
        { key: '_order_source', value: 'Manual Dashboard' },
        ...(size ? [{ key: 'size', value: size }, { key: 'সাইজ', value: size }] : []),
        ...(district ? [{ key: 'district', value: district }] : []),
        ...(thana ? [{ key: 'thana', value: thana }] : []),
      ],
    };

    const res = await fetch(`${cleanUrl}/wp-json/wc/v3/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(newOrderPayload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Failed to create WooCommerce order' }, { status: res.status });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (err: any) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}