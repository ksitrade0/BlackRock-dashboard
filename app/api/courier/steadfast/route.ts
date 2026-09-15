import { NextResponse } from 'next/server';
import axios from 'axios';

// আপনার দেওয়া আসল নির্ভুল কি
const STEADFAST_API_KEY = 'n5wjg5pat2seuxiiz1mmw7evsl1ehzuw';
const STEADFAST_SECRET_KEY = 'jv5elbxxof0qxlshgnf2mpwv';
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

    const res = await axios.post(`${STEADFAST_BASE_URL}/create_order`, payload, {
      headers: {
        'Api-Key': STEADFAST_API_KEY,
        'Secret-Key': STEADFAST_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    return NextResponse.json({ success: true, data: res.data });
  } catch (error: any) {
    console.error('Steadfast Error Detail:', error.response?.data || error.message);
    const msg =
      error.response?.data?.message ||
      (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : '') ||
      'Failed to push to Steadfast';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}