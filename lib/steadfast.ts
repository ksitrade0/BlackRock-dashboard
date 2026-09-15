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

export async function createSteadfastOrder(payload: SteadfastOrderPayload) {
  // কি এবং সিক্রেটের বাড়তি স্পেস ট্রিম করে নেওয়া হচ্ছে
  const apiKey = (process.env.STEADFAST_API_KEY || '').trim();
  const secretKey = (process.env.STEADFAST_SECRET_KEY || '').trim();

  // ফোন নম্বর থেকে সব স্পেস ও ড্যাশ বাদ দিয়ে পিওর ১১ ডিজিট করা হচ্ছে
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
    console.error('Steadfast Error Detail:', error.response?.data || error.message);
    throw new Error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
  }
}