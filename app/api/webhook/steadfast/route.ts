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

    // =======================================================
    // ১. ডাটাবেজ এবং WooCommerce রিয়েল-টাইম অটো-আপডেট লজিক
    // =======================================================
    try {
      const orderRows: any = await query(
        `SELECT * FROM orders WHERE invoice = ? OR consignment_id = ? LIMIT 1`,
        [invoice, consignmentId]
      );

      if (orderRows && orderRows.length > 0) {
        const dbOrder = orderRows[0];
        const storeId = dbOrder.store_id;
        const orderId = dbOrder.id;

        customerName = dbOrder.customer_name || customerName;
        address = dbOrder.address || address;
        items = dbOrder.items || items;

        let newWooStatus = '';
        if (status === 'delivered' || status === 'partial_delivered') newWooStatus = 'completed';
        else if (status === 'cancelled' || status === 'returned' || status === 'return' || status === 'cancelled_approval_pending') newWooStatus = 'cancelled';

        let url = ''; let key = ''; let secret = '';
        const sId = String(storeId || '').toLowerCase();
        
        if (sId.includes('aastha') || sId === 'store2' || sId === '2') {
          url = process.env.STORE2_URL || 'https://aasthanaturalsbd.com';
          key = process.env.STORE2_KEY || '';
          secret = process.env.STORE2_SECRET || '';
        } else {
          url = process.env.STORE1_URL || 'https://ruhamawear.com';
          key = process.env.STORE1_KEY || '';
          secret = process.env.STORE1_SECRET || '';
        }

        if (url && key && secret) {
          const cleanUrl = url.replace(/\/$/, '');
          const authHeader = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');

          const updatePayload: any = { meta_data: [{ key: 'courierStatus', value: status }] };
          if (newWooStatus) updatePayload.status = newWooStatus;

          await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: authHeader },
            body: JSON.stringify(updatePayload),
          });
        }

        if (newWooStatus) {
           await query(`UPDATE orders SET status = ? WHERE id = ?`, [newWooStatus, orderId]);
        }

        // 🚀 CAPI
        if (newWooStatus === 'completed') {
            const PIXEL_ID = '1407475261571485';
            const ACCESS_TOKEN = 'EAAZBgIMx3nh0BSYfDyK54YtwjU7ejlxU0TrAc8tpakyOVPEatBs7kSOJKpnSlk06hoIZAaTxdfyUtOF7thgIUfifFAmvNQbUkEUpC2NakeRKZCSnlhCYPN5P4fXnn743W5xvOO9JohVloRjr2llm0Dh3k0fqp0ZByINexW9BbMh9VQgMP5kcZBG1oqDWuuQZDZD';
            const orderTotal = parseFloat(dbOrder.total || '0');
            const orderPhone = dbOrder.phone || '';
            const hashData = (data: string) => data ? crypto.createHash('sha256').update(data.replace(/[^0-9]/g, '')).digest('hex') : '';

            try {
                await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: [{ event_name: 'Purchase', event_time: Math.floor(Date.now() / 1000), action_source: 'website', event_id: orderId.toString(), user_data: { ph: orderPhone ? [hashData(orderPhone)] : [] }, custom_data: { currency: 'BDT', value: orderTotal } }] })
                });
            } catch (capiErr) {}
        }
      }
    } catch (dbErr) {}

    // =======================================================
    // ২. টেলিগ্রাম নোটিফিকেশন লজিক (অ্যাডভান্সড সামারিসহ)
    // =======================================================
    if (status === 'delivered') {
      let sameDayTotal = 0;
      let sameDayDelivered = 0;
      let sameDayReturned = 0;
      let sameDayPending = 0;
      let pendingOrdersList: any[] = [];
      
      try {
        // আপনার অরিজিনাল সিকিউর লজিক: API থেকে ডেটা টানা
        const dashRes = await fetch('https://app.ruhamawear.com/api/orders');
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          if (dashData && Array.isArray(dashData.orders)) {
            const matchedOrder = dashData.orders.find((o: any) => String(o.invoice) === String(invoice) || String(o.consignmentId) === String(consignmentId));

            if (matchedOrder && matchedOrder.dateCreated) {
              const d = new Date(matchedOrder.dateCreated);
              orderDate = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
              const targetDateStr = d.toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' });

              // একই দিনের পার্সেলগুলো ফিল্টার করা
              const sameDayOrders = dashData.orders.filter((o: any) => {
                if (!o.dateCreated) return false;
                return new Date(o.dateCreated).toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' }) === targetDateStr;
              });

              sameDayTotal = sameDayOrders.length;

              sameDayOrders.forEach((o: any) => {
                const oStatus = (o.courierStatus || '').toLowerCase();
                const wStatus = (o.status || '').toLowerCase();
                
                if (wStatus === 'completed' || oStatus === 'delivered' || oStatus === 'partial_delivered') {
                  sameDayDelivered++;
                } else if (['cancelled', 'failed'].includes(wStatus) || ['cancelled', 'returned', 'return', 'cancelled_approval_pending'].includes(oStatus)) {
                  sameDayReturned++;
                } else if (o.trackingCode || o.consignmentId) {
                  sameDayPending++;
                  if (String(o.invoice) !== String(invoice)) {
                    pendingOrdersList.push(o);
                  }
                }
              });
            }
          }
        }
      } catch (err) {}

      // স্টেডফাস্টের API থেকে কাস্টমারের নাম ও ঠিকানা কনফার্ম করা
      if (customerName === 'সম্মানিত কাস্টমার' && consignmentId) {
        try {
          const apiKey = process.env.STEADFAST_API_KEY || 'n5wjg5pat2seuxiiz1mmw7evsl1ehzuw';
          const secretKey = process.env.STEADFAST_SECRET_KEY || 'jv5elbxxof0qxlshgnf2mpwv';
          const stRes = await fetch(`https://portal.packzy.com/api/v1/status_by_cid/${consignmentId}`, { headers: { 'Api-Key': apiKey, 'Secret-Key': secretKey } });
          const stData = await stRes.json();
          if (stData && stData.delivery_status) {
            customerName = stData.delivery_status.recipient_name || customerName;
            address = stData.delivery_status.recipient_address || address;
          }
        } catch (e) {}
      }

      const today = new Date();
      const deliveryDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear().toString().slice(-2)}`;

      // মেসেজ তৈরি করা
      tgMessage = 
        `🎉 <b>DELIVERY COMPLETED</b> 🎉\n` +
        `-----------------------------------\n` +
        `🧾 <b>ইনভয়েস:</b> #${invoice}\n` +
        `🔖 <b>CID:</b> <code>${consignmentId || trackingCode}</code>\n` +
        `📅 [পাঠানো: ${orderDate} / ডেলিভারি: ${deliveryDate}]\n\n` +
        `👤 <b>নাম:</b> ${customerName}\n` +
        `📍 <b>ঠিকানা:</b> ${address}\n` +
        `📦 <b>আইটেম:</b> ${items}\n` +
        `-----------------------------------\n`;

      if (pendingOrdersList.length > 0) {
        tgMessage += `⚠️ <b>নজর দিন:</b> ${orderDate} তারিখে পাঠানো মোট ${sameDayTotal} টি পার্সেলের মধ্যে এখনো <b>${sameDayPending} টি পার্সেল পেন্ডিং</b> আছে:\n\n`;
        pendingOrdersList.forEach((pO: any, index: number) => {
          const pCid = pO.consignmentId || pO.trackingCode || 'N/A';
          const pItems = pO.items || 'N/A';
          tgMessage += `⏳ <b>পেন্ডিং ${index + 1}:</b> #${pO.invoice} (CID: <code>${pCid}</code>)\n`;
          tgMessage += `👤 ${pO.customerName || 'N/A'}\n`;
          tgMessage += `📦 ${pItems}\n\n`;
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
        `• <b>ইনভয়েস:</b> #${invoice}\n` +
        `• <b>স্ট্যাটাস:</b> <code>${status.toUpperCase()}</code>\n` +
        `• <b>CID:</b> <code>${consignmentId}</code>\n` +
        `${note ? `• <b>কারণ / নোট:</b> <i>${note}</i>\n` : ''}`;
    } 
    else if (note || riderName) {
      tgMessage = `⚠️ <b>রাইডার আপডেট / বিশেষ নোট</b>\n` +
        `-----------------------\n` +
        `• <b>ইনভয়েস:</b> #${invoice}\n` +
        `• <b>বর্তমান অবস্থা:</b> <code>${status.toUpperCase() || 'IN TRANSIT'}</code>\n` +
        `• <b>CID:</b> <code>${consignmentId}</code>\n` +
        `${riderName ? `• <b>রাইডার:</b> ${riderName} (${riderPhone})\n` : ''}` +
        `• <b>রাইডারের নোট:</b> <b>${note || 'কোনো নোট দেওয়া হয়নি'}</b>\n\n` +
        `<i>জরুরি ফলোআপের জন্য প্রস্তুত থাকুন!</i>`;
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
    return NextResponse.json({ success: false, warning: error.message }, { status: 200 });
  }
}