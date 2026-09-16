import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const store1Url = (process.env.STORE1_URL || 'https://ruhamawear.com').replace(/\/$/, '');
    const store1Key = process.env.STORE1_KEY || '';
    const store1Secret = process.env.STORE1_SECRET || '';

    const store2Url = (process.env.STORE2_URL || 'https://aasthanaturalsbd.com').replace(/\/$/, '');
    const store2Key = process.env.STORE2_KEY || '';
    const store2Secret = process.env.STORE2_SECRET || '';

    const fetchStoreOrders = async (storeId: string, storeName: string, url: string, key: string, secret: string) => {
      if (!key || !secret) return [];
      try {
        const auth = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
        const res = await fetch(`${url}/wp-json/wc/v3/orders?per_page=50`, {
          headers: { Authorization: auth },
          cache: 'no-store',
        });
        if (!res.ok) {
          console.error(`Error fetching from ${storeName}:`, res.statusText);
          return [];
        }
        const data = await res.json();
        if (!Array.isArray(data)) return [];

        return data.map((o: any) => {
          let extractedDistrict = o.billing?.city || o.billing?.state || '';
          let extractedThana = '';
          let customSize = '';
          let staffName = '';

          if (Array.isArray(o.meta_data)) {
            o.meta_data.forEach((m: any) => {
              const k = String(m.key || '').toLowerCase();
              if (k.includes('thana')) extractedThana = String(m.value || '');
              if (k.includes('district')) extractedDistrict = String(m.value || '');
              if (k.includes('size') || k.includes('সাইজ')) customSize = String(m.value || '');
              if (k === '_processed_by_staff') staffName = String(m.value || '');
            });
          }

          const itemsSummary = (o.line_items || [])
            .map((it: any) => `${it.name} x ${it.quantity}`)
            .join(', ');

          return {
            id: o.id,
            storeId,
            storeName,
            invoice: String(o.id),
            customerName: `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.trim() || 'Customer',
            phone: o.billing?.phone || '',
            address: o.billing?.address_1 || '',
            district: extractedDistrict,
            thana: extractedThana,
            size: customSize,
            total: o.total || '0',
            status: o.status || 'pending',
            dateCreated: o.date_created || new Date().toISOString(),
            items: itemsSummary || 'No Items',
            staffName: staffName,
          };
        });
      } catch (err) {
        console.error(`Fetch exception for ${storeName}:`, err);
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
    console.error('Global orders route error:', error);
    return NextResponse.json({ orders: [], error: error.message }, { status: 500 });
  }
}