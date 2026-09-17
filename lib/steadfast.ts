import axios from 'axios';

const STEADFAST_BASE_URL = 'https://portal.packzy.com/api/v1';

export interface SteadfastOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

// ১. স্টিডফাস্টে নতুন পার্সেল বুক করার ফাংশন
export async function createSteadfastOrder(payload: SteadfastOrderPayload) {
  const apiKey = (process.env.STEADFAST_API_KEY || '').trim();
  const secretKey = (process.env.STEADFAST_SECRET_KEY || '').trim();

  if (!apiKey || !secretKey) {
    throw new Error('Steadfast API Key or Secret Key missing in .env.local');
  }

  // ফোন নম্বর থেকে সব স্পেস ও ড্যাশ বাদ দিয়ে পিওর ১১ ডিজিট নিশ্চিত করা
  let cleanPhone = payload.recipient_phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('880')) {
    cleanPhone = cleanPhone.substring(2);
  }

  const cleanPayload = {
    invoice: payload.invoice,
    recipient_name: payload.recipient_name,
    recipient_phone: cleanPhone,
    recipient_address: payload.recipient_address,
    cod_amount: Number(payload.cod_amount) || 0,
    note: payload.note || '',
  };

  try {
    const response = await axios.post(
      `${STEADFAST_BASE_URL}/create_order`,
      cleanPayload,
      {
        headers: {
          'Api-Key': apiKey,
          'Secret-Key': secretKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 15000,
      }
    );

    return response.data;
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.errors ||
      error.message ||
      'Failed to push order to Steadfast';
    console.error('Steadfast Create Error:', error.response?.data || error.message);
    throw new Error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
  }
}

// ২. কনসাইনমেন্ট আইডি (CID) দিয়ে লাইভ স্ট্যাটাস চেক
export async function getSteadfastStatusByCid(consignmentId: string | number) {
  const apiKey = (process.env.STEADFAST_API_KEY || '').trim();
  const secretKey = (process.env.STEADFAST_SECRET_KEY || '').trim();

  try {
    const response = await axios.get(
      `${STEADFAST_BASE_URL}/status_by_cid/${consignmentId}`,
      {
        headers: {
          'Api-Key': apiKey,
          'Secret-Key': secretKey,
          Accept: 'application/json',
        },
        timeout: 15000,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(`Steadfast CID Error (${consignmentId}):`, error.response?.data || error.message);
    return null;
  }
}

// ৩. ট্র্যাকিং কোড দিয়ে লাইভ স্ট্যাটাস চেক
export async function getSteadfastStatusByTrackingCode(trackingCode: string) {
  const apiKey = (process.env.STEADFAST_API_KEY || '').trim();
  const secretKey = (process.env.STEADFAST_SECRET_KEY || '').trim();

  try {
    const response = await axios.get(
      `${STEADFAST_BASE_URL}/status_by_trackingcode/${encodeURIComponent(trackingCode.trim())}`,
      {
        headers: {
          'Api-Key': apiKey,
          'Secret-Key': secretKey,
          Accept: 'application/json',
        },
        timeout: 15000,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(`Steadfast Tracking Error (${trackingCode}):`, error.response?.data || error.message);
    return null;
  }
}

// ৪. ইনভয়েস নম্বর দিয়ে স্ট্যাটাস চেক
export async function getSteadfastStatusByInvoice(invoice: string) {
  const apiKey = (process.env.STEADFAST_API_KEY || '').trim();
  const secretKey = (process.env.STEADFAST_SECRET_KEY || '').trim();

  try {
    const response = await axios.get(
      `${STEADFAST_BASE_URL}/status_by_invoice/${encodeURIComponent(invoice.trim())}`,
      {
        headers: {
          'Api-Key': apiKey,
          'Secret-Key': secretKey,
          Accept: 'application/json',
        },
        timeout: 15000,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(`Steadfast Invoice Error (${invoice}):`, error.response?.data || error.message);
    return null;
  }
}

// ৫. সার্বজনীন স্ট্যাটাস চেকার (CID অথবা Tracking Code যেকোনোটি দিলে স্বয়ংক্রিয়ভাবে ট্র্যাক করবে)
export async function getSteadfastStatus(identifier: string) {
  if (!identifier) return null;
  const cleanId = String(identifier).trim();
  
  if (/^\d+$/.test(cleanId)) {
    return await getSteadfastStatusByCid(cleanId);
  }
  return await getSteadfastStatusByTrackingCode(cleanId);
}