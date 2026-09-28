import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
      if (Array.isArray(localRows)) localRows.forEach((row: any) => localOrdersMap.set(`${row.store_id}-${row.id}`, row.items));
    } catch (e1) {
      try {
        const fallbackRows: any = await query(`SELECT id, items FROM orders`);
        if (Array.isArray(fallbackRows)) fallbackRows.forEach((row: any) => localOrdersMap.set(String(row.id), row.items));
      } catch (e2) {}
    }

    const fetchStoreOrders = async (storeId: string, storeName: string, url: string, key: string, secret: string) => {
      if (!key || !secret) return [];
      try {
        const auth = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
        const res = await fetch(`${url}/wp-json/wc/v3/orders?per_page=100&status=any&_t=${Date.now()}`, {
          headers: { Authorization: auth, 'Cache-Control': 'no-cache, no-store' }, cache: 'no-store',
        });
        if (!res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data)) return [];

        return data.map((o: any) => {
          let extractedDistrict = o.billing?.city || o.billing?.state || '';
          let extractedThana = ''; let customSize = ''; let staffName = '';
          let extractedAddress = o.billing?.address_1 || '';
          let trackingCode = ''; let consignmentId = ''; let courierStatus = '';
          let customItems = ''; 

          if (Array.isArray(o.meta_data)) {
            o.meta_data.forEach((m: any) => {
              const k = String(m.key || '').toLowerCase();
              const val = String(m.value || '');
              if (k.includes('thana')) extractedThana = val;
              if (k.includes('district')) extractedDistrict = val;
              if (k.includes('address')) extractedAddress = val;
              if (k.includes('size')) customSize = val;
              if (k.includes('_processed_by_staff')) staffName = val;
              if (k === 'trackingcode') trackingCode = val;
              if (k === 'consignmentid') consignmentId = val;
              if (k === 'courierstatus') courierStatus = val;
              if (k === 'custom_dashboard_items') customItems = val;
            });
          }

          if (!extractedAddress && o.billing?.address_2) extractedAddress = o.billing.address_2;

          // 🚀 উকমার্সের line_items পুরোপুরি বাদ দেওয়া হলো। এখন শুধু কাস্টম সেভ করা আইটেম দেখাবে।
          let localSavedItems = localOrdersMap.get(`${storeId}-${o.id}`);
          if (localSavedItems === undefined) localSavedItems = localOrdersMap.get(String(o.id));
          const finalItems = customItems ? customItems : (localSavedItems || '');

          return {
            id: o.id, storeId, storeName, invoice: String(o.id),
            customerName: `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.trim() || 'Customer',
            phone: o.billing?.phone || '', address: extractedAddress, district: extractedDistrict,
            thana: extractedThana, size: customSize, total: o.total || '0', status: o.status || 'pending',
            // 🚀 টাইমজোন ফিক্স: gmt টাইম নিয়ে 'Z' যুক্ত করা হলো
            dateCreated: o.date_created_gmt ? o.date_created_gmt + 'Z' : (o.date_created || new Date().toISOString()), 
            items: finalItems, staffName: staffName,
            trackingCode: trackingCode, consignmentId: consignmentId, courierStatus: courierStatus,
          };
        });
      } catch (err) { return []; }
    };

    const [ordersStore1, ordersStore2] = await Promise.all([
      fetchStoreOrders('store1', 'Ruhama Wear', store1Url, store1Key, store1Secret),
      fetchStoreOrders('store2', 'Aastha Naturals BD', store2Url, store2Key, store2Secret),
    ]);

    const combined = [...ordersStore1, ...ordersStore2].sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
    return NextResponse.json({ orders: combined });
  } catch (error: any) {
    return NextResponse.json({ orders: [], error: error.message }, { status: 500 });
  }
}