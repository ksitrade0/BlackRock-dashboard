import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Store Mapping
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

    // অর্ডার স্থায়ীভাবে মুছে ফেলার অ্যাকশন
    if (action === 'delete') {
      const deleteRes = await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}?force=true`, {
        method: 'DELETE',
        headers: { Authorization: authHeader },
      });

      if (!deleteRes.ok) {
        const err = await deleteRes.json();
        return NextResponse.json({ error: err.message || 'Failed to delete' }, { status: deleteRes.status });
      }
      return NextResponse.json({ success: true });
    }

    // অর্ডার সম্পূর্ণ আপডেট পে-লোড
    const updatePayload: any = {};
    if (status) updatePayload.status = status;
    if (total) updatePayload.total = String(total);

    // বিলিং ও কাস্টমার ডাটা তৈরি
    const billing: any = {};
    if (customerName) {
      const nameParts = customerName.trim().split(' ');
      billing.first_name = nameParts[0] || '';
      billing.last_name = nameParts.slice(1).join(' ') || '';
    }
    if (phone) billing.phone = phone;

    // ঠিকানা, জেলা ও থানা সাজানো
    if (streetAddress || district || thana) {
      billing.address_1 = streetAddress || '';
      if (thana) billing.address_2 = `Thana: ${thana}`;
      if (district) {
        billing.city = district;
        billing.state = district;
      }
    }

    if (Object.keys(billing).length > 0) {
      updatePayload.billing = billing;
      updatePayload.shipping = billing; // শিপিং ঠিকানাও একই সাথে আপডেট
    }

    // মেটা-ডাটা আপডেট (স্টাফ, সাইজ, থানা, জেলা)
    const metaData: any[] = [];
    if (staffName) {
      metaData.push({ key: '_processed_by_staff', value: staffName });
    }
    if (size) {
      metaData.push({ key: 'size', value: size });
      metaData.push({ key: 'সাইজ', value: size });
    }
    if (district) metaData.push({ key: 'district', value: district });
    if (thana) metaData.push({ key: 'thana', value: thana });

    if (metaData.length > 0) {
      updatePayload.meta_data = metaData;
    }

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

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}