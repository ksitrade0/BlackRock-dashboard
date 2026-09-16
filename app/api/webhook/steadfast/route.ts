import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8985282113:AAHpocozZnhC8Eog9pS1rXCCmTDf_QHsyu4';
    const groupCourier = process.env.TELEGRAM_COURIER_GROUP_ID || '-5518408506';

    // Steadfast Webhook Payload হ্যান্ডলিং
    const invoice = body.invoice || body.order_id || 'N/A';
    const status = String(body.status || body.delivery_status || '').toLowerCase();
    const trackingCode = body.tracking_code || '';
    const consignmentId = body.consignment_id || '';
    const note = body.note || body.rider_note || body.comment || '';
    const riderName = body.rider_name || body.deliveryman_name || '';
    const riderPhone = body.rider_phone || body.deliveryman_phone || '';
    const cod = body.cod_amount || '';

    let tgMessage = '';

    if (status === 'delivered') {
      tgMessage = `🎉 <b>পার্সেল সফলভাবে ডেলিভারি সম্পন্ন!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 <b>ইনভয়েস:</b> #${invoice}\n` +
        `🏷️ <b>CID:</b> <code>${consignmentId}</code> | <b>Tracking:</b> <code>${trackingCode}</code>\n` +
        `💰 <b>কালেক্টেড COD:</b> ৳${cod}\n` +
        `⏰ <b>সময়:</b> ${new Date().toLocaleString('en-GB', { hour12: true })}`;
    } else if (status === 'cancelled' || status === 'partial_delivered') {
      tgMessage = `⚠️ <b>পার্সেল রিটার্ন / আংশিক ডেলিভারি!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 <b>ইনভয়েস:</b> #${invoice}\n` +
        `📌 <b>স্ট্যাটাস:</b> <code>${status.toUpperCase()}</code>\n` +
        `🏷️ <b>CID:</b> <code>${consignmentId}</code>\n` +
        `${note ? `📝 <b>কারণ / নোট:</b> <i>${note}</i>\n` : ''}`;
    } else if (note || riderName) {
      // যদি ডেলিভারি না হয়ে রাইডারের কোনো নোট থাকে
      tgMessage = `🚴‍♂️ <b>রাইডার আপডেট / বিশেষ নোট</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 <b>ইনভয়েস:</b> #${invoice}\n` +
        `📌 <b>বর্তমান অবস্থা:</b> <code>${status.toUpperCase() || 'IN TRANSIT'}</code>\n` +
        `🏷️ <b>CID:</b> <code>${consignmentId}</code>\n` +
        `${riderName ? `👤 <b>রাইডার:</b> ${riderName} (${riderPhone})\n` : ''}` +
        `📝 <b>রাইডারের নোট:</b> <b>${note || 'কোনো নোট দেওয়া হয়নি'}</b>\n` +
        `⚠️ <i>জরুরি ফলোআপের জন্য প্রস্তুত থাকুন!</i>`;
    }

    if (tgMessage) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: groupCourier,
          text: tgMessage,
          parse_mode: 'HTML',
        }),
      });
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error('Steadfast Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}