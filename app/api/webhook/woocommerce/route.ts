import { NextResponse } from 'next/server';

// WooCommerce যদি URL চেক করার জন্য GET বা HEAD পাঠায়
export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint is active and running' }, { status: 200 });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    // ১. পিং বা খালি ডাটা চেক (WooCommerce Handshake)
    if (!rawBody || rawBody.trim() === '') {
      return NextResponse.json({ success: true, message: 'Empty ping accepted' }, { status: 200 });
    }

    let order: any = {};
    try {
      order = JSON.parse(rawBody);
    } catch {
      // যদি JSON না হয়, তবুও 200 দিয়ে পাস করে দিবে
      return NextResponse.json({ success: true, message: 'Raw ping accepted' }, { status: 200 });
    }

    // ২. যদি এটা WooCommerce-এর টেস্ট পিং হয় (যাতে আসল অর্ডারের বিলিং তথ্য থাকে না)
    if (order.webhook_id || !order.id || !order.billing) {
      return NextResponse.json({ success: true, message: 'WooCommerce test handshake verified' }, { status: 200 });
    }

    // ৩. আসল নতুন অর্ডার আসলে টেলিগ্রাম নোটিফিকেশন প্রসেসিং
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8985282113:AAHpocozZnhC8Eog9pS1rXCCmTDf_QHsyu4';
    const orderChatId = process.env.TELEGRAM_ORDERS_CHAT_ID || '-1004425589317';

    const customerName = `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim() || 'সম্মানিত কাস্টমার';
    const phone = order.billing?.phone || 'N/A';

    let fullAddress = [
      order.billing?.address_1,
      order.billing?.address_2,
      order.billing?.city,
      order.billing?.state,
    ]
      .filter(Boolean)
      .join(', ');

    let customSize = '';
    if (Array.isArray(order.meta_data)) {
      order.meta_data.forEach((meta: any) => {
        const key = String(meta.key || '').toLowerCase();
        if (key.includes('address') || key.includes('thana') || key.includes('district')) {
          if (meta.value && typeof meta.value === 'string' && !fullAddress.includes(meta.value)) {
            fullAddress += ` | ${meta.value}`;
          }
        }
        if (key.includes('size') || key.includes('সাইজ')) {
          customSize = String(meta.value);
        }
      });
    }

    const itemsList = Array.isArray(order.line_items)
      ? order.line_items
          .map((item: any) => {
            const itemSize = item.meta_data?.find((m: any) => String(m.key || '').toLowerCase().includes('size'))?.value;
            const displaySize = itemSize || customSize ? ` [Size: ${itemSize || customSize}]` : '';
            return `• ${item.name || 'Product'} x ${item.quantity || 1}${displaySize}`;
          })
          .join('\n')
      : '• আইটেম বিস্তারিত ড্যাশবোর্ডে দেখুন';

    const siteUrl = order._links?.self?.[0]?.href || '';
    const storeName = siteUrl.includes('aasthanaturals') ? 'Aastha Naturals BD' : 'RUHAMA WEAR';

    const message =
      `🔔 <b>নতুন অর্ডার এসেছে! (NEW ORDER)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🏪 <b>স্টোর:</b> ${storeName}\n` +
      `📦 <b>অর্ডার নম্বর:</b> #${order.id}\n` +
      `👤 <b>কাস্টমার:</b> ${customerName}\n` +
      `📞 <b>ফোন:</b> <code>${phone}</code>\n` +
      `📍 <b>ঠিকানা:</b> ${fullAddress || 'N/A'}\n` +
      `🛍️ <b>আইটেম:</b>\n${itemsList}\n` +
      `💵 <b>মোট টাকা (COD):</b> ৳${order.total || '0'}\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ <i>ড্যাশবোর্ডে গিয়ে অর্ডারটি প্রসেস করুন!</i>`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: orderChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    // WooCommerce যেন কোনোভাবেই 500 না পায়, তাই সবসময় 200 রিটার্ন করা হলো
    return NextResponse.json({ success: true, warning: error.message }, { status: 200 });
  }
}