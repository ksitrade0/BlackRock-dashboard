import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8985282113:AAHpocozZnhC8Eog9pS1rXCCmTDf_QHsyu4';
    const groupCourier = process.env.TELEGRAM_COURIER_GROUP_ID || '-5518408506';

    const sfApiKey = process.env.STEADFAST_API_KEY || '';
    const sfSecretKey = process.env.STEADFAST_SECRET_KEY || '';
    const sfBaseUrl = (process.env.STEADFAST_BASE_URL || 'https://portal.steadfast.com.bd/api/v1').replace(/\/$/, '');

    // WooCommerce থেকে সাম্প্রতিক ৫০টি অর্ডার ফেচ
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
      return NextResponse.json({ error: 'Failed to pull orders' }, { status: 500 });
    }

    const todayDateStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateStr = yesterday.toLocaleDateString('en-CA');

    let todayCount = 0;
    let todayDelivered = 0;
    let todayDeliveredCash = 0;
    let todayPending = 0;

    let yesterdayCount = 0;
    let yesterdayDelivered = 0;
    let yesterdayPending = 0;

    const pendingByDate: Record<string, any[]> = {};
    let totalPendingCash = 0;

    // পার্সেল অ্যানালাইসিস
    for (const order of orders) {
      const orderDate = (order.date_created || '').split('T')[0];
      const invoice = String(order.id);
      const customer = `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim() || 'Customer';
      const phone = order.billing?.phone || '';
      const total = Number(order.total || 0);

      // কুরিয়ার স্ট্যাটাস চেক
      let courierStatus = 'pending';
      let cid = '';
      let riderNote = '';

      if (sfApiKey && sfSecretKey) {
        try {
          const sfRes = await fetch(`${sfBaseUrl}/status_by_invoice/${invoice}`, {
            headers: {
              'Api-Key': sfApiKey,
              'Secret-Key': sfSecretKey,
            },
          });
          const sfData = await sfRes.json();
          if (sfData && sfData.status === 200 && sfData.delivery_status) {
            courierStatus = sfData.delivery_status.toLowerCase();
            cid = sfData.consignment_id || '';
            riderNote = sfData.note || '';
          }
        } catch {}
      }

      const isDelivered = courierStatus === 'delivered';
      const isCancelled = courierStatus === 'cancelled';

      if (orderDate === todayDateStr) {
        todayCount++;
        if (isDelivered) {
          todayDelivered++;
          todayDeliveredCash += total;
        } else if (!isCancelled) {
          todayPending++;
        }
      } else if (orderDate === yesterdayDateStr) {
        yesterdayCount++;
        if (isDelivered) {
          yesterdayDelivered++;
        } else if (!isCancelled) {
          yesterdayPending++;
        }
      }

      // যদি পার্সেলটি এখনও ডেলিভারি না হয় এবং ক্যান্সেল না হয়
      if (!isDelivered && !isCancelled) {
        totalPendingCash += total;
        if (!pendingByDate[orderDate]) {
          pendingByDate[orderDate] = [];
        }
        pendingByDate[orderDate].push({
          invoice,
          customer,
          phone,
          total,
          cid,
          status: courierStatus,
          note: riderNote,
        });
      }
    }

    // রিপোর্ট ফরম্যাটিং
    const sortedDates = Object.keys(pendingByDate).sort((a, b) => b.localeCompare(a));
    let agingSection = '';

    sortedDates.forEach((dateStr) => {
      const list = pendingByDate[dateStr];
      const isToday = dateStr === todayDateStr;
      const isYest = dateStr === yesterdayDateStr;
      const tag = isToday ? 'আজকের' : isYest ? 'গতকালকের' : 'পুরনো অনিষ্পন্ন';

      agingSection += `\n📅 <b>[${tag}] ${dateStr} (${list.length}টি পেন্ডিং):</b>\n`;
      list.forEach((item, idx) => {
        agingSection += ` ${idx + 1}. #${item.invoice} - ${item.customer} (<code>${item.phone}</code>) | ৳${item.total}\n` +
          `    └ <i>CID: ${item.cid || 'N/A'} [${item.status.toUpperCase()}]</i>` +
          `${item.note ? ` ⚠️ Note: <b>${item.note}</b>` : ''}\n`;
      });
    });

    const reportMessage = `📊 <b>STEADFAST DAILY DISPATCH & AUDIT REPORT</b>\n` +
      `📅 <b>তারিখ:</b> ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} | <b>রাত ১২:০০ টা</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📦 <b>আজকের পার্সেল সারসংক্ষেপ (Today):</b>\n` +
      ` • মোট পাঠানো: ${todayCount} টি\n` +
      ` • সফল ডেলিভারি: ${todayDelivered} টি (৳${todayDeliveredCash})\n` +
      ` • এখনো বাকি/পেন্ডিং: ${todayPending} টি\n\n` +
      `📦 <b>গতকালকের পার্সেল আপডেট (Yesterday):</b>\n` +
      ` • গতকালকের মোট: ${yesterdayCount} টি\n` +
      ` • সফল ডেলিভারি: ${yesterdayDelivered} টি\n` +
      ` • এখনো পেন্ডিং: ${yesterdayPending} টি\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ <b>তারিখ অনুযায়ী আটকে থাকা পার্সেল তালিকা:</b>\n` +
      `${agingSection || ' • আলহামদুলিল্লাহ, কোনো পার্সেল পেন্ডিং নেই!\n'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 <b>সর্বমোট আটকে থাকা COD ক্যাশ:</b> ৳${totalPendingCash}\n` +
      `🚨 <i>জরুরি: ২+ দিন আগের পার্সেলগুলোর জন্য হাবের সাথে কথা বলুন!</i>`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: groupCourier,
        text: reportMessage,
        parse_mode: 'HTML',
      }),
    });

    return NextResponse.json({ success: true, message: 'Report generated and sent to Telegram' });
  } catch (error: any) {
    console.error('Courier Cron Report Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}