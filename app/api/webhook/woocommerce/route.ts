import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    let bodyText = '';
    try {
      bodyText = await req.text();
    } catch {
      return NextResponse.json({ success: true, message: 'Empty body ping accepted' }, { status: 200 });
    }

    if (!bodyText || bodyText.trim() === '') {
      return NextResponse.json({ success: true, message: 'Ping acknowledged' }, { status: 200 });
    }

    let order: any = null;
    try {
      order = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ success: true, message: 'Non-JSON ping acknowledged' }, { status: 200 });
    }

    // WooCommerce Webhook ping/verification হ্যান্ডলিং
    if (!order || !order.id || order.webhook_id) {
      return NextResponse.json({ success: true, message: 'Webhook handshake verified successfully' }, { status: 200 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8985282113:AAHpocozZnhC8Eog9pS1rXCCmTDf_QHsyu4';
    const orderChatId = process.env.TELEGRAM_ORDERS_CHAT_ID || '-1004425589317';

    // ১. কাস্টমারের তথ্য ও মোবাইল
    const customerName = `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim() || 'Customer';
    const phone = order.billing?.phone || 'N/A';

    // ২. ঠিকানা
    let fullAddress = [
      order.billing?.address_1,
      order.billing?.address_2,
      order.billing?.city,
      order.billing?.state,
    ]
      .filter(Boolean)
      .join(', ');

    // কাস্টম মেটা ডাটা (সাইজ ও ঠিকানা)
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

    // ৩. অর্ডারকৃত প্রডাক্টস
    const itemsList = Array.isArray(order.line_items)
      ? order.line_items
          .map((item: any) => {
            const itemSize = item.meta_data?.find((m: any) => String(m.key || '').toLowerCase().includes('size'))?.value;
            const displaySize = itemSize || customSize ? ` [Size: ${itemSize || customSize}]` : '';
            return `• ${item.name || 'Product'} x ${item.quantity || 1}${displaySize}`;
          })
          .join('\n')
      : '• Standard Item';

    // ৪. স্টোর নাম
    const siteUrl = order._links?.self?.[0]?.href || '';
    const storeName = siteUrl.includes('aasthanaturals') ? 'Aastha Naturals BD' : 'RUHAMA WEAR';

    // ৫. মেসেজ তৈরি
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

    // ৬. টেলিগ্রাম গ্রুপ ১ (Orders)-এ মেসেজ পাঠানো
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
    // 500 না দিয়ে 200 রিটার্ন করা যাতে WooCommerce ওয়েব হুক ডিসেবল না করে
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}