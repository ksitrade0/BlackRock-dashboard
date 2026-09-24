import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 🚀 ক্যাশ ধ্বংস করার এক্সট্রিম লজিক
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const store1Url = (process.env.STORE1_URL || 'https://ruhamawear.com').replace(/\/$/, '');
  const store1Key = process.env.STORE1_KEY || '';
  const store1Secret = process.env.STORE1_SECRET || '';

  try {
    const store2Url = (process.env.STORE2_URL || 'https://aasthanaturalsbd.com').replace(/\/$/, '');
    const store2Key = process.env.STORE2_KEY || '';
    const store2Secret = process.env.STORE2_SECRET || '';

    let localOrdersMap = new Map();
    try {
      const localRows: any = await query(`SELECT store_id, id, items FROM orders`);
      if (Array.isArray(localRows)) {
        localRows.forEach((row: any) => {
          localOrdersMap.set(`${row.store_id}-${row.id}`, row.items);
        });
      }
    } catch (dbErr) {}

    const fetchStoreOrders = async (storeId: string, storeName: string, url: string, key: string, secret: string) => {
      if (!key || !secret) return [];
      try {
        const auth = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
        
        // 🚀 URL এর শেষে &_t=Date.now() বসানো হয়েছে যাতে Cloudflare বা WP ক্যাশ কাজ না করে
        const res = await fetch(`${url}/wp-json/wc/v3/orders?per_page=100&status=any&_t=${Date.now()}`, {
          headers: { 
            Authorization: auth,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-store',
        });
        
        if (!res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data)) return [];

        return data.map((o: any) => {
          let extractedDistrict = o.billing?.city || o.billing?.state || '';
          let extractedThana = '';
          let customSize = '';
          let staffName = '';
          let extractedAddress = o.billing?.address_1 || '';
          
          let trackingCode = '';
          let consignmentId = '';
          let courierStatus = '';
          let customItems = ''; 

          if (Array.isArray(o.meta_data)) {
            o.meta_data.forEach((m: any) => {
              const k = String(m.key || '').toLowerCase();
              const val = String(m.value || '');
              
              if (k.includes('thana')) extractedThana = val;
              if (k.includes('district')) extractedDistrict = val;
              if (k.includes('address') || k.includes('ঠিকানা') || k.includes('সম্পূর্ণ')) {
                if (val.trim()) extractedAddress = val;
              }
              if (k.includes('size') || k.includes('সাইজ')) customSize = val;
              if (k.includes('_processed_by_staff')) staffName = val;
              
              if (k === 'trackingcode') trackingCode = val;
              if (k === 'consignmentid') consignmentId = val;
              if (k === 'courierstatus') courierStatus = val;
              if (k === 'custom_dashboard_items') customItems = val; // 🚀 উকমার্স থেকে কাস্টম আইটেম পড়া হচ্ছে
            });
          }

          if (!extractedAddress && o.billing?.address_2) {
            extractedAddress = o.billing.address_2;
          }

          const itemsSummary = (o.line_items || [])
            .map((it: any) => `${it.name} x ${it.quantity}`)
            .join(', ');

          const localSavedItems = localOrdersMap.get(`${storeId}-${o.id}`);
          
          // 🚀 মেটা-ডাটায় আইটেম থাকলে সেটা, না থাকলে লোকাল ডিবি, না থাকলে উকমার্সের ডিফল্ট
          const finalItems = customItems ? customItems : ((localSavedItems !== undefined && localSavedItems !== null && localSavedItems !== '')
            ? localSavedItems
            : (itemsSummary || 'Custom Order Item'));

          return {
            id: o.id,
            storeId,
            storeName,
            invoice: String(o.id),
            customerName: `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.trim() || 'Customer',
            phone: o.billing?.phone || '',
            address: extractedAddress,
            district: extractedDistrict,
            thana: extractedThana,
            size: customSize,
            total: o.total || '0',
            status: o.status || 'pending',
            dateCreated: o.date_created || new Date().toISOString(),
            items: finalItems,
            staffName: staffName,
            trackingCode: trackingCode,
            consignmentId: consignmentId,
            courierStatus: courierStatus,
          };
        });
      } catch (err) {
        return [];
      }
    };

    const [ordersStore1, ordersStore2] = await Promise.all([
      fetchStoreOrders('store1', 'Ruhama Wear', store1Url, store1Key, store1Secret),
      fetchStoreOrders('store2', 'Aastha Naturals BD', store2Url, store2Key, store2Secret),
    ]);

    const combined = [...ordersStore1, ...ordersStore2].sort(
      (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    );

    return NextResponse.json({ orders: combined });
  } catch (error: any) {
    return NextResponse.json({ orders: [], error: error.message }, { status: 500 });
  }
}