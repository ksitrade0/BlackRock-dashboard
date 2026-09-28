import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8985282113:AAHpocozZnhC8Eog9pS1-rXCCmTDf_QHsyu4';
    const groupCourier = process.env.TELEGRAM_COURIER_GROUP_ID || '-5518408506';

    const invoice = body.invoice || body.order_id || 'N/A';
    const status = String(body.status || body.delivery_status || '').toLowerCase();
    const trackingCode = body.tracking_code || '';
    const consignmentId = body.consignment_id || '';
    const note = body.note || body.rider_note || body.comment || '';
    const riderName = body.rider_name || body.deliveryman_name || '';
    const riderPhone = body.rider_phone || body.deliveryman_phone || '';

    let customerName = 'সম্মানিত কাস্টমার';
    let address = 'ঠিকানা পাওয়া যায়নি';
    let items = 'বিস্তারিত ড্যাশবোর্ডে দেখুন';
    let orderDate = 'N/A';
    let tgMessage = '';

    // 🚀 টেলিগ্রামের HTML এরর ঠেকানোর ফাংশন
    const escapeHtml = (str: any) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // =======================================================
    // ১. ডাটাবেজ এবং WooCommerce আপডেট
    // =======================================================
    try {
      const orderRows: any = await query(`SELECT * FROM orders WHERE invoice = ? OR consignment_id = ? LIMIT 1`, [invoice, consignmentId]);

      if (orderRows && orderRows.length > 0) {
        const dbOrder = orderRows[0];
        customerName = dbOrder.customer_name || customerName;
        address = dbOrder.address || address;
        items = dbOrder.items || items;

        let newWooStatus = '';
        if (status === 'delivered' || status === 'partial_delivered') newWooStatus = 'completed';
        else if (status === 'cancelled' || status === 'returned' || status === 'return' || status === 'cancelled_approval_pending') newWooStatus = 'cancelled';

        let url = '', key = '', secret = '';
        const sId = String(dbOrder.store_id || '').toLowerCase();
        if (sId.includes('aastha') || sId === 'store2' || sId === '2') {
          url = process.env.STORE2_URL || 'https://aasthanaturalsbd.com'; key = process.env.STORE2_KEY || ''; secret = process.env.STORE2_SECRET || '';
        } else {
          url = process.env.STORE1_URL || 'https://ruhamawear.com'; key = process.env.STORE1_KEY || ''; secret = process.env.STORE1_SECRET || '';
        }

        // 🚀 ফায়ার এন্ড ফরগেট (সময় বাঁচানোর জন্য)
        if (url && key && secret) {
          const authHeader = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
          const updatePayload: any = { meta_data: [{ key: 'courierStatus', value: status }] };
          if (newWooStatus) updatePayload.status = newWooStatus;
          fetch(`${url.replace(/\/$/, '')}/wp-json/wc/v3/orders/${dbOrder.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: authHeader }, body: JSON.stringify(updatePayload),
          }).catch(()=>{}); 
        }

        if (newWooStatus) await query(`UPDATE orders SET status = ? WHERE id = ?`, [newWooStatus, dbOrder.id]);

        // CAPI
        if (newWooStatus === 'completed') {
          const hashData = (data: string) => data ? crypto.createHash('sha256').update(data.replace(/[^0-9]/g, '')).digest('hex') : '';
          fetch(`https://graph.facebook.com/v19.0/1407475261571485/events?access_token=EAAZBgIMx3nh0BSYfDyK54YtwjU7ejlxU0TrAc8tpakyOVPEatBs7kSOJKpnSlk06hoIZAaTxdfyUtOF7thgIUfifFAmvNQbUkEUpC2NakeRKZCSnlhCYPN5P4fXnn743W5xvOO9JohVloRjr2llm0Dh3k0fqp0ZByINexW9BbMh9VQgMP5kcZBG1oqDWuuQZDZD`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [{ event_name: 'Purchase', event_time: Math.floor(Date.now() / 1000), action_source: 'website', event_id: dbOrder.id.toString(), user_data: { ph: dbOrder.phone ? [hashData(dbOrder.phone)] : [] }, custom_data: { currency: 'BDT', value: parseFloat(dbOrder.total || '0') } }] })
          }).catch(()=>{});
        }
      }
    } catch (dbErr) {}

    // =======================================================
    // ২. টেলিগ্রাম নোটিফিকেশন লজিক
    // =======================================================
    if (status === 'delivered') {
      let sameDayTotal = 0; let sameDayDelivered = 0; let sameDayReturned = 0; let sameDayPending = 0;
      let pendingOrdersList: any[] = [];

      try {
        if (consignmentId) {
          const apiKey = process.env.STEADFAST_API_KEY || 'n5wjg5pat2seuxiiz1mmw7evsl1ehzuw';
          const secretKey = process.env.STEADFAST_SECRET_KEY || 'jv5elbxxof0qxlshgnf2mpwv';
          const stRes = await fetch(`https://portal.packzy.com/api/v1/status_by_cid/${consignmentId}`, { headers: { 'Api-Key': apiKey, 'Secret-Key': secretKey } });
          const stData = await stRes.json();
          if (stData && stData.delivery_status) {
            if (customerName === 'সম্মানিত কাস্টমার') customerName = stData.delivery_status.recipient_name || customerName;
            if (address === 'ঠিকানা পাওয়া যায়নি') address = stData.delivery_status.recipient_address || address;
            if (stData.delivery_status.created_at) {
              const cDate = new Date(stData.delivery_status.created_at);
              orderDate = `${cDate.getDate()}/${cDate.getMonth() + 1}/${cDate.getFullYear().toString().slice(-2)}`;
            }
          }
        }

        // 🚀 টাইমআউট লজিক: ড্যাশবোর্ড ৬ সেকেন্ডের বেশি লোড নিলে সে রিকোয়েস্ট কেটে দেবে
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); 
        const dashRes = await fetch('https://app.ruhamawear.com/api/orders', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (dashRes.ok) {
          const dashData = await dashRes.json();
          if (dashData && Array.isArray(dashData.orders)) {
            const matchedOrder = dashData.orders.find((o: any) => String(o.invoice) === String(invoice) || String(o.consignmentId) === String(consignmentId));
            if (matchedOrder && matchedOrder.dateCreated && orderDate === 'N/A') {
              const d = new Date(matchedOrder.dateCreated);
              orderDate = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
            }

            const targetDateStr = matchedOrder?.dateCreated 
              ? new Date(matchedOrder.dateCreated).toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' }) 
              : (orderDate !== 'N/A' ? new Date(orderDate.split('/').reverse().join('-')).toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' }) : null);

            if (targetDateStr) {
              const sameDayOrders = dashData.orders.filter((o: any) => o.dateCreated && new Date(o.dateCreated).toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' }) === targetDateStr);
              sameDayTotal = sameDayOrders.length;
              sameDayOrders.forEach((o: any) => {
                const cs = (o.courierStatus || '').toLowerCase(); const ws = (o.status || '').toLowerCase();
                if (ws === 'completed' || cs === 'delivered' || cs === 'partial_delivered') sameDayDelivered++;
                else if (['cancelled', 'failed'].includes(ws) || ['cancelled', 'returned', 'return', 'cancelled_approval_pending'].includes(cs)) sameDayReturned++;
                else if (o.trackingCode || o.consignmentId) {
                  sameDayPending++;
                  if (String(o.invoice) !== String(invoice)) pendingOrdersList.push(o);
                }
              });
            }
          }
        }
      } catch (err) { console.log('Dashboard fetch timeout/error skipped'); }

      const today = new Date();
      const deliveryDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear().toString().slice(-2)}`;

      tgMessage = `🎉 <b>DELIVERY COMPLETED</b> 🎉\n` +
        `-----------------------------------\n` +
        `🧾 <b>ইনভয়েস:</b> #${escapeHtml(invoice)}\n` +
        `🔖 <b>CID:</b> <code>${escapeHtml(consignmentId || trackingCode)}</code>\n` +
        `📅 [পাঠানো: ${orderDate} / ডেলিভারি: ${deliveryDate}]\n\n` +
        `👤 <b>নাম:</b> ${escapeHtml(customerName)}\n` +
        `📍 <b>ঠিকানা:</b> ${escapeHtml(address)}\n` +
        `📦 <b>আইটেম:</b> ${escapeHtml(items)}\n` +
        `-----------------------------------\n`;

      if (pendingOrdersList.length > 0) {
        tgMessage += `⚠️ <b>নজর দিন:</b> ${orderDate} তারিখে পাঠানো মোট ${sameDayTotal} টি পার্সেলের মধ্যে এখনো <b>${sameDayPending} টি পার্সেল পেন্ডিং</b> আছে:\n\n`;
        pendingOrdersList.forEach((pO: any, index: number) => {
          tgMessage += `⏳ <b>পেন্ডিং ${index + 1}:</b> #${escapeHtml(pO.invoice)} (CID: <code>${escapeHtml(pO.consignmentId || pO.trackingCode || 'N/A')}</code>)\n`;
          tgMessage += `👤 ${escapeHtml(pO.customerName || 'N/A')}\n`;
          tgMessage += `📦 ${escapeHtml(pO.items || 'N/A')}\n\n`;
        });
      } else if (sameDayTotal > 0) {
        tgMessage += `✅ <b>দুর্দান্ত!</b> ${orderDate} তারিখে পাঠানো সকল পার্সেলের ফয়সালা হয়ে গেছে (কোনো পেন্ডিং নেই)।\n`;
      }
      if (sameDayTotal > 0) {
        tgMessage += `📊 <i>সামারি: মোট: ${sameDayTotal} | ডেলিভারি: ${sameDayDelivered} | রিটার্ন: ${sameDayReturned} | পেন্ডিং: ${sameDayPending}</i>`;
      }
    } 
    else if (status === 'cancelled' || status === 'partial_delivered') {
      tgMessage = `❌ <b>পার্সেল রিটার্ন / আংশিক ডেলিভারি!</b>\n` +
        `• <b>ইনভয়েস:</b> #${escapeHtml(invoice)}\n` +
        `• <b>স্ট্যাটাস:</b> <code>${escapeHtml(status.toUpperCase())}</code>\n` +
        `• <b>CID:</b> <code>${escapeHtml(consignmentId)}</code>\n` +
        `${note ? `• <b>কারণ / নোট:</b> <i>${escapeHtml(note)}</i>\n` : ''}`;
    } 
    else if (note || riderName) {
      tgMessage = `⚠️ <b>রাইডার আপডেট / বিশেষ নোট</b>\n` +
        `-----------------------\n` +
        `• <b>ইনভয়েস:</b> #${escapeHtml(invoice)}\n` +
        `• <b>বর্তমান অবস্থা:</b> <code>${escapeHtml(status.toUpperCase() || 'IN TRANSIT')}</code>\n` +
        `• <b>CID:</b> <code>${escapeHtml(consignmentId)}</code>\n` +
        `${riderName ? `• <b>রাইডার:</b> ${escapeHtml(riderName)} (${escapeHtml(riderPhone)})\n` : ''}` +
        `• <b>রাইডারের নোট:</b> <b>${escapeHtml(note || 'কোনো নোট দেওয়া হয়নি')}</b>\n\n` +
        `<i>জরুরি ফলোআপের জন্য প্রস্তুত থাকুন!</i>`;
    }

    if (tgMessage) {
      const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: groupCourier, text: tgMessage, parse_mode: 'HTML' }),
      });
      // যদি টেলিগ্রামে কোনো এরর আসে, সেটা সার্ভারে লগ হবে
      if (!tgResponse.ok) {
         const errText = await tgResponse.text();
         console.error('Telegram API Error:', errText);
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error('Steadfast Webhook Error:', error);
    return NextResponse.json({ success: false, warning: error.message }, { status: 200 });
  }
}