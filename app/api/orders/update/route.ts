import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { storeId, orderId, status, staffName, action } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Store Configuration Mapping (Ruhama Wear বা store1 যাই আসুক সাপোর্ট করবে)
    let url = '';
    let key = '';
    let secret = '';

    const sId = String(storeId || '').toLowerCase();

    if (sId.includes('ruhama') || sId === 'store1' || sId === '1') {
      url = process.env.STORE1_URL || 'https://ruhamawear.com';
      key = process.env.STORE1_KEY || '';
      secret = process.env.STORE1_SECRET || '';
    } else if (sId.includes('aastha') || sId === 'store2' || sId === '2') {
      url = process.env.STORE2_URL || 'https://aasthanaturalsbd.com';
      key = process.env.STORE2_KEY || '';
      secret = process.env.STORE2_SECRET || '';
    } else {
      // ডিফল্ট হিসেবে Store 1 (Ruhama Wear) ব্যবহার করবে যেন এরর না দেয়
      url = process.env.STORE1_URL || 'https://ruhamawear.com';
      key = process.env.STORE1_KEY || '';
      secret = process.env.STORE1_SECRET || '';
    }

    if (!url || !key || !secret) {
      return NextResponse.json({ error: 'Store configuration missing in environment' }, { status: 500 });
    }

    const cleanUrl = url.replace(/\/$/, '');
    const authHeader = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');

    // যদি অর্ডার ডিলিট করার অ্যাকশন হয়
    if (action === 'delete') {
      const deleteUrl = `${cleanUrl}/wp-json/wc/v3/orders/${orderId}?force=true`;
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          Authorization: authHeader,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        return NextResponse.json({ error: errData.message || 'ডিলিট করতে ব্যর্থ হয়েছে' }, { status: res.status });
      }

      return NextResponse.json({ success: true, message: 'Order deleted successfully' });
    }

    // স্ট্যাটাস ও স্টাফ মেটা ডাটা আপডেট
    const updatePayload: any = {};
    if (status) updatePayload.status = status;

    if (staffName) {
      updatePayload.meta_data = [
        {
          key: '_processed_by_staff',
          value: staffName,
        },
      ];
    }

    const updateUrl = `${cleanUrl}/wp-json/wc/v3/orders/${orderId}`;
    const res = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(updatePayload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে' }, { status: res.status });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}