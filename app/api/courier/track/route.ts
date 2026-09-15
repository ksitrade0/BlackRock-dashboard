import { NextResponse } from 'next/server';
import axios from 'axios';

const STEADFAST_API_KEY = 'n5wjg5pat2seuxiiz1mmw7evsl1ehzuw';
const STEADFAST_SECRET_KEY = 'jv5elbxxof0qxlshgnf2mpwv';
const STEADFAST_BASE_URL = 'https://portal.packzy.com/api/v1';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const consignmentId = searchParams.get('consignment_id');
  const trackingCode = searchParams.get('tracking_code');

  if (!consignmentId && !trackingCode) {
    return NextResponse.json({ error: 'Tracking info required' }, { status: 400 });
  }

  const endpoint = consignmentId
    ? `${STEADFAST_BASE_URL}/status_by_cid/${consignmentId}`
    : `${STEADFAST_BASE_URL}/status_by_trackingcode/${trackingCode}`;

  try {
    const res = await axios.get(endpoint, {
      headers: {
        'Api-Key': STEADFAST_API_KEY,
        'Secret-Key': STEADFAST_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    return NextResponse.json({ success: true, data: res.data });
  } catch (error: any) {
    return NextResponse.json({ error: 'Tracking check failed' }, { status: 400 });
  }
}