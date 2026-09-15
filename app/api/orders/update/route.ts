import { NextResponse } from 'next/server';
import axios from 'axios';

const STORES: Record<string, { url?: string; key?: string; secret?: string }> = {
  store1: {
    url: process.env.STORE1_URL,
    key: process.env.STORE1_KEY,
    secret: process.env.STORE1_SECRET,
  },
  store2: {
    url: process.env.STORE2_URL,
    key: process.env.STORE2_KEY,
    secret: process.env.STORE2_SECRET,
  },
};

export async function POST(req: Request) {
  try {
    const { storeId, orderId, status } = await req.json();

    const store = STORES[storeId];
    if (!store || !store.url || !store.key || !store.secret) {
      return NextResponse.json({ error: 'Store configuration not found' }, { status: 400 });
    }

    const authHeader = 'Basic ' + Buffer.from(`${store.key}:${store.secret}`).toString('base64');

    // WooCommerce REST API দিয়ে সরাসরি অর্ডারের স্ট্যাটাস আপডেট
    const res = await axios.put(
      `${store.url}/wp-json/wc/v3/orders/${orderId}`,
      { status: status || 'processing' },
      {
        headers: { Authorization: authHeader },
        timeout: 10000,
      }
    );

    return NextResponse.json({ success: true, order: res.data });
  } catch (error: any) {
    console.error('WooCommerce Update Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.message || 'Failed to update order in website' },
      { status: 500 }
    );
  }
}