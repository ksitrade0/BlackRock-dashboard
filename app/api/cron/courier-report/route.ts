import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function cleanHtml(text: string = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function GET() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8985282113:AAHpocozZnhC8Eog9pS1rXCCmTDf_QHsyu4';
    const groupCourier = process.env.TELEGRAM_COURIER_GROUP_ID || '-5518408506';

    const sfApiKey = (process.env.STEADFAST_API_KEY || '').trim();
    const sfSecretKey = (process.env.STEADFAST_SECRET_KEY || '').trim();
    const sfBaseUrl = (process.env.STEADFAST_BASE_URL || 'https://portal.steadfast.com.bd/api/v1').replace(/\/$/, '');

    const store1Url = (process.env.STORE1_URL || 'https://ruhamawear.com').replace(/\/$/, '');
    const store1Key = process.env.STORE1_KEY || '';
    const store1Secret = process.env.STORE1_SECRET || '';

    const auth = 'Basic ' + Buffer.from(`${store1Key}:${store1Secret}`).toString('base64');
    const resOrders = await fetch(`${store1Url}/wp-json/wc/v3/orders?per_page=30&status=any`, {
      headers: { Authorization: auth },
      cache: 'no-store',
    });

    const orders = await resOrders.json();
    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: 'Failed to pull orders' }, { status: 500 });
    }

    const todayDateStr = new Date().toLocaleDateString('en-CA');
    const nowTime = new Date().getTime();

    const todayDispatchedList: any[] = [];
    const todayDeliveredList: any[] = [];
    const pendingParcelsList: any[] = [];
    let totalTodayDeliveredCash = 0;

    for (const order of orders) {
      const orderDate = (order.date_created || '').split('T')[0];
      const modifiedDate = (order.date_modified || '').split('T')[0];
      const invoice = String(order.id);
      const customer = `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim() || 'Customer';
      const total = Number(order.total || 0);

      const createdTime = new Date(order.date_created).getTime();
      const daysDiff = Math.floor((nowTime - createdTime) / (1000 * 60 * 60 * 24));
      const daysAgoText = daysDiff === 0 ? 'আজকে' : `${daysDiff} দিন আগে`;

      let courierStatus = 'pending';
      let cid = '';

      const isRecent = orderDate === todayDateStr || modifiedDate === todayDateStr;
      if (sfApiKey && sfSecretKey && isRecent) {
        try {
          const sfRes = await fetch(`${sfBaseUrl}/status_by_invoice/${invoice}`, {
            headers: { 'Api-Key': sfApiKey, 'Secret-Key': sfSecretKey },
          });
          const sfData = await sfRes.json();
          if (sfData && sfData.status === 200 && sfData.delivery_status) {
            courierStatus = sfData.delivery_status.toLowerCase();
            cid = sfData.consignment_id || '';
          }
        } catch {}
      }

      const isDelivered = courierStatus === 'delivered' || (order.status || '').toLowerCase() === 'completed';
      const isCancelled = courierStatus === 'cancelled' || (order.status || '').toLowerCase() === 'cancelled';

      if (orderDate === todayDateStr) {
        todayDispatchedList.push({ invoice, customer, cid, total });
      }

      if (isDelivered && (modifiedDate === todayDateStr || orderDate === todayDateStr)) {
        todayDeliveredList.push({ invoice, customer, total });
        totalTodayDeliveredCash += total;
      }

      if (!isDelivered && !isCancelled) {
        pendingParcelsList.push({ invoice, customer, daysAgoText, status: courierStatus.toUpperCase() });
      }
    }

    const reportDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let msg = `📊 <b>BLACK ROCK — কুরিয়ার অডিট রিপোর্ট</b>\n`;
    msg += `📅 <b>তারিখ:</b> ${reportDateStr} | <b>রাত ১০:০০ টা</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `<b>১. 🚚 আজকের প্রেরিত পার্সেল (${todayDispatchedList.length} টি):</b>\n`;
    if (todayDispatchedList.length === 0) {
      msg += `  <i>(আজ কোনো নতুন পার্সেল পাঠানো হয়নি)</i>\n\n`;
    } else {
      todayDispatchedList.forEach((item, idx) => {
        msg += `  ${idx + 1}. <b>#${item.invoice}</b> — ${cleanHtml(item.customer)} (CID: <code>${cleanHtml(item.cid || 'N/A')}</code>)\n`;
      });
      msg += `\n`;
    }

    msg += `<b>২. ✅ আজকের সফল ডেলিভারি (${todayDeliveredList.length} টি):</b>\n`;
    if (todayDeliveredList.length === 0) {
      msg += `  <i>(আজ কোনো ডেলিভারি সম্পন্ন হয়নি)</i>\n\n`;
    } else {
      todayDeliveredList.forEach((item, idx) => {
        msg += `  ${idx + 1}. <b>#${item.invoice}</b> — ${cleanHtml(item.customer)} | কালেকশন: <b>৳${item.total.toLocaleString('en-IN')}</b>\n`;
      });
      msg += `\n`;
    }

    msg += `<b>৩. ⏳ পেন্ডিং পার্সেলসমূহ (${pendingParcelsList.length} টি):</b>\n`;
    if (pendingParcelsList.length === 0) {
      msg += `  <i>(কোনো পার্সেল পেন্ডিং নেই)</i>\n\n`;
    } else {
      pendingParcelsList.slice(0, 10).forEach((p, idx) => {
        msg += `  ${idx + 1}. <b>#${p.invoice}</b> — ${cleanHtml(p.customer)} (${p.daysAgoText}) [<code>${cleanHtml(p.status)}</code>]\n`;
      });
      if (pendingParcelsList.length > 10) {
        msg += `  <i>...এবং আরও ${pendingParcelsList.length - 10} টি পার্সেল</i>\n`;
      }
      msg += `\n`;
    }

    msg += `<b>৪. 💰 আজকের কালেকশন বিবরণ ও মোট হিসেব:</b>\n`;
    if (todayDeliveredList.length === 0) {
      msg += `  <i>(আজ কোনো ক্যাশ কালেকশন জমা হয়নি)</i>\n`;
    } else {
      todayDeliveredList.forEach((item, idx) => {
        msg += `  ${idx + 1}. #${item.invoice} | ${cleanHtml(item.customer)} ➔ <b>৳${item.total.toLocaleString('en-IN')}</b>\n`;
      });
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👉 <b>সর্বমোট কালেকশন: ৳${totalTodayDeliveredCash.toLocaleString('en-IN')}</b>\n`;

    // টেলিগ্রাম লিমিট সেফগার্ড (৩৮০০ অক্ষরের বেশি হলে সংক্ষেপ করা)
    if (msg.length > 3800) {
      msg = msg.substring(0, 3800) + '\n\n<i>...(বাকি অংশ সংক্ষেপ করা হয়েছে)</i>';
    }

    // টেলিগ্রাম এপিআই কল
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: groupCourier,
        text: msg,
        parse_mode: 'HTML',
      }),
    });

    const tgData = await tgRes.json();

    // HTML ফরম্যাট রিজেক্ট হলে স্বয়ংক্রিয় সাধারণ টেক্সট ব্যাকআপ
    if (!tgData.ok) {
      const plainText = msg.replace(/<[^>]*>/g, '');
      const backupRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: groupCourier,
          text: plainText,
        }),
      });
      const backupData = await backupRes.json();
      return NextResponse.json({ success: backupData.ok, telegram: backupData, fallback: true });
    }

    return NextResponse.json({ success: true, telegram: tgData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}