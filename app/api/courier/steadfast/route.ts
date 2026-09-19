import { NextResponse } from 'next/server';
import axios from 'axios';
import { query } from '@/lib/db';

const STEADFAST_API_KEY = 'n5wjg5pat2seuxiiz1mmw7evsl1ehzuw';
const STEADFAST_SECRET_KEY = 'jv5elbxxof qxlshgnf2mpwv';
const STEADFAST_BASE_URL = 'https://portal.packzy.com/api/v1';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ফোন নম্বর থেকে বাড়তি চিহ্ন বাদ দিয়ে পিওর ১১ ডিজিট নিশ্চিত করা
    let phone = (body.recipient_phone || '').replace(/[^0-9]/g, '');
    if (phone.startsWith('880')) {
      phone = phone.substring(2);
    }

    const payload = {
      invoice: String(body.invoice),
      recipient_name: String(body.recipient_name),
      recipient_phone: phone,
      recipient_address: String(body.recipient_address),
      cod_amount: Number(body.cod_amount) || 0,
      note: body.note ? String(body.note) : '',
    };

    // ১. SteadFast এপিআই-এ অর্ডার পাঠানো
    const res = await axios.post(`${STEADFAST_BASE_URL}/create_order`, payload, {
      headers: {
        'Api-Key': STEADFAST_API_KEY,
        'Secret-Key': STEADFAST_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    // ২. অর্ডার সফলভাবে সাবমিট হওয়ার পর ইনভেন্টরি থেকে স্টক মাইনাস (Reduce) করা
    // ধরে নিচ্ছি বডিতে item_name এবং quantity পাঠানো হচ্ছে
    if (body.item_name && body.quantity) {
      try {
        await query(
          'UPDATE inventory SET stock = stock - ? WHERE item_name = ?',
          [Number(body.quantity) || 1, body.item_name]
        );
      } catch (stockErr) {
        console.error('Inventory Stock Reduce Warning:', stockErr);
      }
    }

    return NextResponse.json({ success: true, data: res.data });
  } catch (error: any) {
    console.error('Fastest/Steadfast Error Detail:', error.response?.data || error.message);
    const msg =
      error.response?.data?.message ||
      (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : '') ||
      'Failed to push to Steadfast';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}