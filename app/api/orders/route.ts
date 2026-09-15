import { NextResponse } from 'next/server';
import axios from 'axios';

const STORES = [
  {
    id: 'ruhama',
    name: 'Ruhama Wear',
    url: 'https://ruhamawear.com',
    key: process.env.STORE1_KEY || '',
    secret: process.env.STORE1_SECRET || '',
  },
  {
    id: 'aastha',
    name: 'Aastha Naturals',
    url: 'https://aasthanaturalsbd.com',
    key: process.env.STORE2_KEY || '',
    secret: process.env.STORE2_SECRET || '',
  },
];

// গভীর ও নির্ভরযোগ্য অ্যাড্রেস এক্সট্রাকশন ফাংশন
function extractCustomerAddress(order: any): string {
  const parts: string[] = [];

  // ১. সাধারণ WooCommerce বিলিং ও শিপিং অ্যাড্রেস
  if (order.billing?.address_1) parts.push(order.billing.address_1.trim());
  if (order.billing?.address_2) parts.push(order.billing.address_2.trim());
  if (order.billing?.city) parts.push(order.billing.city.trim());
  if (order.billing?.state) parts.push(order.billing.state.trim());

  // ২. মেটা ডাটা (Billing extra fields) ডিপ স্ক্যান
  if (Array.isArray(order.meta_data)) {
    for (const meta of order.meta_data) {
      const rawKey = String(meta.key || '').toLowerCase();
      let rawVal = meta.value;

      // যদি ভ্যালু কোনো অবজেক্ট বা অ্যারে হয়
      if (typeof rawVal === 'object' && rawVal !== null) {
        rawVal = JSON.stringify(rawVal);
      }
      const valStr = String(rawVal || '').trim();

      if (!valStr || valStr === 'false' || valStr === 'true') continue;

      // বাংলা ও ইংরেজি সকল সম্ভাব্য কি-ওয়ার্ড ম্যাচিং
      const isAddressKey =
        rawKey.includes('ঠিকানা') ||
        rawKey.includes('সম্পূর্ণ') ||
        rawKey.includes('address') ||
        rawKey.includes('thikana') ||
        rawKey.includes('extra') ||
        rawKey.includes('location') ||
        rawKey.includes('district') ||
        rawKey.includes('thana') ||
        rawKey.includes('custom');

      if (isAddressKey) {
        if (!parts.includes(valStr)) {
          parts.push(valStr);
        }
      }
    }
  }

  // ৩. শিপিং অ্যাড্রেস ব্যাকআপ
  if (parts.length === 0 && order.shipping?.address_1) {
    parts.push(order.shipping.address_1.trim());
    if (order.shipping?.city) parts.push(order.shipping.city.trim());
  }

  // ৪. কোনো কারণে যদি মেটা ডাটায় কি-ওয়ার্ড ম্যাচ না করে কিন্তু ভ্যালুতে অ্যাড্রেসের মতো কমা বা টেক্সট থাকে
  if (parts.length === 0 && Array.isArray(order.meta_data)) {
    for (const meta of order.meta_data) {
      const rawKey = String(meta.key || '');
      const valStr = String(meta.value || '').trim();
      // ইন্টারনাল হিডেন কি (_wp, _wc ইত্যাদি) বাদ দিয়ে বড় টেক্সট খোঁজা
      if (!rawKey.startsWith('_') && valStr.length > 8 && !rawKey.toLowerCase().includes('size') && !rawKey.toLowerCase().includes('সাইজ')) {
        parts.push(valStr);
        break;
      }
    }
  }

  return parts.filter(Boolean).join(', ');
}

// সাইজ আলাদাভাবে বের করার ফাংশন
function extractProductSize(order: any): string {
  let size = '';
  if (Array.isArray(order.meta_data)) {
    for (const meta of order.meta_data) {
      const key = String(meta.key || '').toLowerCase();
      const val = typeof meta.value === 'string' ? meta.value.trim() : '';
      if (!val) continue;

      if (key.includes('সাইজ') || key.includes('size')) {
        size = val;
        break;
      }
    }
  }
  return size;
}

export async function GET() {
  try {
    let allOrders: any[] = [];

    for (const store of STORES) {
      if (!store.key || !store.secret) continue;

      try {
        const authHeader = 'Basic ' + Buffer.from(`${store.key}:${store.secret}`).toString('base64');
        const res = await axios.get(`${store.url}/wp-json/wc/v3/orders?per_page=50`, {
          headers: {
            Authorization: authHeader,
          },
          timeout: 15000,
        });

        if (Array.isArray(res.data)) {
          const formatted = res.data.map((order: any) => {
            const customerName =
              `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim() ||
              order.shipping?.first_name ||
              'Guest';

            const phone = order.billing?.phone || order.shipping?.phone || '';
            const fullAddress = extractCustomerAddress(order);
            const extractedSize = extractProductSize(order);

            const items = order.line_items
              ? order.line_items.map((i: any) => `${i.name} x ${i.quantity}`).join(', ')
              : '';

            return {
              id: order.id,
              storeId: store.id,
              storeName: store.name,
              invoice: String(order.id),
              customerName: customerName,
              phone: phone,
              address: fullAddress,
              size: extractedSize,
              total: order.total,
              status: order.status,
              dateCreated: order.date_created,
              items: items,
            };
          });

          allOrders = [...allOrders, ...formatted];
        }
      } catch (storeError: any) {
        console.error(`Error fetching from ${store.name}:`, storeError.message);
      }
    }

    allOrders.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());

    return NextResponse.json({ orders: allOrders });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}