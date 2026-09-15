import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const order = await req.json();

    if (!order || !order.id) {
      return NextResponse.json({ message: 'Webhook test received' }, { status: 200 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8985282113:AAHpocozZnhC8Eog9pS1rXCCmTDf_QHsyu4';
    const orderChatId = process.env.TELEGRAM_ORDERS_CHAT_ID || '-1004425589317';

    const customerName = `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim() || 'Customer';
    const phone = order.billing?.phone || 'N/A';
    
    let fullAddress = [
      order.billing?.address_1,
      order.billing?.address_2,
      order.billing?.city,
      order.billing?.state
    ].filter(Boolean).join(', ');

    let customSize = '';
    if (Array.isArray(order.meta_data)) {
      order.meta_data.forEach((meta: any) => {
        const key = (meta.key || '').toLowerCase();
        if (key.includes('address') || key.includes('thana') || key.includes('district')) {
          if (meta.value && typeof meta.value === 'string' && !fullAddress.includes(meta.value)) {
            fullAddress += ` | ${meta.value}`;
          }
        }
        if (key.includes('size') || key.includes('সাইজ')) {
          customSize = meta.value;
        }
      });
    }

    const itemsList = (order.line_items || [])
      .map((item: any) => {
        const itemSize = item.meta_data?.find((m: any) => m.key.toLowerCase().includes('size'))?.value;
        const displaySize = itemSize || customSize ? ` [Size: ${itemSize || customSize}]` : '';
        return `• ${item.name} x ${item.quantity}${displaySize}`;
      })
      .join('\n');

    const siteUrl = order._links?.self?.[0]?.href || '';
    const storeName = siteUrl.includes('aasthanaturals') ? 'Aastha Naturals BD' : 'RUHAMA WEAR';

    const message = `🔔 <b>নতুন অর্ডার এসেছে! (NEW ORDER)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🏪 <b>স্টোর:</b> ${storeName}\n` +
      `📦 <b>অর্ডার নম্বর:</b> #${order.id}\n` +
      `👤 <b>কাস্টমার:</b> ${customerName}\n` +
      `📞 <b>ফোন:</b> <code>${phone}</code>\n` +
      `📍 <b>ঠিকানা:</b> ${fullAddress || 'N/A'}\n` +
      `🛍️ <b>আইটেম:</b>\n${itemsList || '• Standard Item'}\n` +
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}