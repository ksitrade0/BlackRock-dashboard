import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function escapeHtml(str: string = '') {
  return String(str)
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

    // WooCommerce থেকে সাম্প্রতিক ৫০টি অর্ডার ফেচ (দ্রুত লোড নিশ্চিত করতে)
    const store1Url = (process.env.STORE1_URL || 'https://ruhamawear.com').replace(/\/$/, '');
    const store1Key = process.env.STORE1_KEY || '';
    const store1Secret = process.env.STORE1_SECRET || '';

    const auth = 'Basic ' + Buffer.from(`${store1Key}:${store1Secret}`).toString('base64');
    const resOrders = await fetch(`${store1Url}/wp-json/wc/v3/orders?per_page=50&status=any`, {
      headers: { Authorization: auth },
      cache: 'no-store',
    });

    const orders = await resOrders.json();
    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: 'Failed to pull WooCommerce orders' }, { status: 500 });
    }

    const todayDateStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const nowTime = new Date().getTime();

    // দ্রুত প্রসেসিংয়ের জন্য প্যারালাল প্রমিজ ব্যবহার
    const processedOrders = await Promise.all(
      orders.map(async (order: any) => {
        const orderDate = (order.date_created || '').split('T')[0];
        const modifiedDate = (order.date_modified || '').split('T')[0];
        const invoice = String(order.id);
        const customer = `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim() || 'Customer';
        const phone = order.billing?.phone || '';
        const total = Number(order.total || 0);

        const createdTime = new Date(order.date_created).getTime();
        const daysDiff = Math.floor((nowTime - createdTime) / (1000 * 60 * 60 * 24));
        const daysAgoText = daysDiff === 0 ? 'আজকে পাঠানো' : `${daysDiff} দিন আগে`;

        let courierStatus = 'pending';
        let cid = '';

        // শুধুমাত্র আজকের বা সক্রিয় পার্সেলের জন্য কুরিয়ার চেক হবে (টাইমআউট সহ)
        const isRecentOrActive = orderDate === todayDateStr || modifiedDate === todayDateStr || order.status === 'processing';

        if (sfApiKey && sfSecretKey && isRecentOrActive) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000); // ৪ সেকেন্ডের মধ্যে রেসপন্স না পেলে স্কিপ

            const sfRes = await fetch(`${sfBaseUrl}/status_by_invoice/${invoice}`, {
              headers: {
                'Api-Key': sfApiKey,
                'Secret-Key': sfSecretKey,
              },
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            const sfData = await sfRes.json();
            if (sfData && sfData.status === 200 && sfData.delivery_status) {
              courierStatus = sfData.delivery_status.toLowerCase();
              cid = sfData.consignment_id || '';
            }
          } catch {}
        }

        const isDelivered = courierStatus === 'delivered' || (order.status || '').toLowerCase() === 'completed';
        const isCancelled = courierStatus === 'cancelled' || (order.status || '').toLowerCase() === 'cancelled';

        return {
          invoice,
          customer,
          phone,
          cid,
          total,
          orderDate,
          modifiedDate,
          daysAgoText,
          courierStatus,
          isDelivered,
          isCancelled,
        };
      })
    );

    const todayDispatchedList: any[] = [];
    const todayDeliveredList: any[] = [];
    const pendingParcelsList: any[] = [];
    let totalTodayDeliveredCash = 0;

    for (const item of processedOrders) {
      // ১. আজকের প্রেরিত পার্সেল
      if (item.orderDate === todayDateStr) {
        todayDispatchedList.push(item);
      }

      // ২. আজকের ডেলিভারি সম্পন্ন হওয়া পার্সেল
      if (item.isDelivered && (item.modifiedDate === todayDateStr || item.orderDate === todayDateStr)) {
        todayDeliveredList.push(item);
        totalTodayDeliveredCash += item.total;
      }

      // ৩. পেন্ডিং পার্সেল
      if (!item.isDelivered && !item.isCancelled) {
        pendingParcelsList.push(item);
      }
    }

    // ৪. টেলিগ্রাম মেসেজ ফরম্যাট
    const reportDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let msg = `📊 <b>BLACK ROCK — আজকের কুরিয়ার অডিট রিপোর্ট</b>\n`;
    msg += `📅 <b>তারিখ:</b> ${reportDateStr} | <b>রাত ১০:০০ টা</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // ১. আজকের প্রেরিত পার্সেল
    msg += `<b>১. 🚚 আজকের প্রেরিত পার্সেল (${todayDispatchedList.length} টি):</b>\n`;
    if (todayDispatchedList.length === 0) {
      msg += `  <i>(আজ কোনো নতুন পার্সেল পাঠানো হয়নি)</i>\n\n`;
    } else {
      todayDispatchedList.forEach((item, idx) => {
        msg += `  ${idx + 1}. <b>#${item.invoice}</b> — কাস্টমার: ${escapeHtml(item.customer)} (CID: <code>${escapeHtml(item.cid || 'N/A')}</code>)\n`;
      });
      msg += `\n`;
    }

    // ২. আজকের ডেলিভারি হওয়া পার্সেল
    msg += `<b>২. ✅ আজকের সফল ডেলিভারি (${todayDeliveredList.length} টি):</b>\n`;
    if (todayDeliveredList.length === 0) {
      msg += `  <i>(আজ কোনো পার্সেল ডেলিভারি সম্পন্ন হয়নি)</i>\n\n`;
    } else {
      todayDeliveredList.forEach((item, idx) => {
        msg += `  ${idx + 1}. <b>#${item.invoice}</b> — ${escapeHtml(item.customer)} | কালেকশন: <b>৳${item.total.toLocaleString('en-IN')}</b>\n`;
      });
      msg += `\n`;
    }

    // ৩. পেন্ডিং পার্সেল
    msg += `<b>৩. ⏳ কুরিয়ারে আটকে থাকা পেন্ডিং পার্সেল (${pendingParcelsList.length} টি):</b>\n`;
    if (pendingParcelsList.length === 0) {
      msg += `  <i>(আলহামদুলিল্লাহ, কোনো পার্সেল পেন্ডিং নেই!)</i>\n\n`;
    } else {
      pendingParcelsList.slice(0, 15).forEach((p, idx) => {
        msg += `  ${idx + 1}. <b>#${p.invoice}</b> — ${escapeHtml(p.customer)} (<i>${p.daysAgoText}</i>) | স্ট্যাটাস: <code>${escapeHtml(p.courierStatus.toUpperCase())}</code>\n`;
      });
      if (pendingParcelsList.length > 15) {
        msg += `  <i>...এবং আরও ${pendingParcelsList.length - 15} টি পার্সেল পেন্ডিং রয়েছে।</i>\n`;
      }
      msg += `\n`;
    }

    // ৪. কালেকশন বিবরণ ও সর্বমোট হিসেব
    msg += `<b>৪. 💰 আজকের কালেকশন বিবরণ ও সর্বমোট হিসেব:</b>\n`;
    if (todayDeliveredList.length === 0) {
      msg += `  <i>(আজ কোনো ক্যাশ কালেকশন জমা হয়নি)</i>\n`;
    } else {
      todayDeliveredList.forEach((item, idx) => {
        msg += `  ${idx + 1}. <b>#${item.invoice}</b> | ${escapeHtml(item.customer)} ➔ <b>৳${item.total.toLocaleString('en-IN')}</b>\n`;
      });
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👉 <b>সর্বমোট আজকের কালেকশন: ৳${totalTodayDeliveredCash.toLocaleString('en-IN')}</b>\n`;

    // টেলিগ্রামে প্রেরণ
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: groupCourier,
        text: msg,
        parse_mode: 'HTML',
      }),
    });

    return NextResponse.json({ success: true, message: 'Fast report generated and sent to Telegram' });
  } catch (error: any) {
    console.error('Courier Cron Report Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}