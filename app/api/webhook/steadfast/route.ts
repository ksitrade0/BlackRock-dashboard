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
    let pendingText = '';
    let tgMessage = '';

    // =======================================================
    // ১. ডাটাবেজ এবং WooCommerce রিয়েল-টাইম অটো-আপডেট লজিক
    // =======================================================
    try {
      const orderRows: any = await query(`SELECT * FROM orders WHERE invoice = ? OR consignment_id = ? LIMIT 1`, [invoice, consignmentId]);

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
          url = process.env.STORE2_URL || 'https://aasthanaturalsbd.com'; key = process.env.STORE2_KEY || ''; secret = process.env.STORE2_SECRET || '';
        } else {
          url = process.env.STORE1_URL || 'https://ruhamawear.com'; key = process.env.STORE1_KEY || ''; secret = process.env.STORE1_SECRET || '';
        }

        if (url && key && secret) {
          const cleanUrl = url.replace(/\/$/, '');
          const authHeader = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
          const updatePayload: any = { meta_data: [{ key: 'courierStatus', value: status }] };
          if (newWooStatus) updatePayload.status = newWooStatus;

          await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: authHeader }, body: JSON.stringify(updatePayload),
          });
        }

        if (newWooStatus) {
           await query(`UPDATE orders SET status = ? WHERE id = ?`, [newWooStatus, orderId]);
        }

        // =======================================================
        // 🚀 META CONVERSIONS API (CAPI)
        // =======================================================
        if (newWooStatus === 'completed') {
            const PIXEL_ID = '1407475261571485';
            const ACCESS_TOKEN = 'EAAZBgIMx3nh0BSYfDyK54YtwjU7ejlxU0TrAc8tpakyOVPEatBs7kSOJKpnSlk06hoIZAaTxdfyUtOF7thgIUfifFAmvNQbUkEUpC2NakeRKZCSnlhCYPN5P4fXnn743W5xvOO9JohVloRjr2llm0Dh3k0fqp0ZByINexW9BbMh9VQgMP5kcZBG1oqDWuuQZDZD';
            
            const orderTotal = parseFloat(dbOrder.total || '0');
            const orderPhone = dbOrder.phone || '';
            const hashData = (data: string) => { if (!data) return ''; return crypto.createHash('sha256').update(data.replace(/[^0-9]/g, '')).digest('hex'); };

            const capiPayload = { data: [{ event_name: 'Purchase', event_time: Math.floor(Date.now() / 1000), action_source: 'website', event_id: orderId.toString(), user_data: { ph: orderPhone ? [hashData(orderPhone)] : [] }, custom_data: { currency: 'BDT', value: orderTotal } }] };

            try { await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(capiPayload) }); } 
            catch (capiErr) {}
        }
      }
    } catch (dbErr) {}

    // =======================================================
    // ২. ডেলিভারি অ্যালার্ট এবং একই দিনের পেন্ডিং স্ট্যাটাস
    // =======================================================
    if (status === 'delivered') {
      try {
        const orderRows: any = await query(`SELECT * FROM orders WHERE invoice = ? OR consignment_id = ? LIMIT 1`, [invoice, consignmentId]);
        
        if (orderRows && orderRows.length > 0) {
          const dbOrder = orderRows[0];
          
          const sentDateObj = new Date(dbOrder.dateSent || dbOrder.dateCreated || new Date());
          const orderDateStr = sentDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' });
          const delvDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' });
          const queryDateStr = sentDateObj.toISOString().split('T')[0];

          // একই তারিখে পাঠানো অন্যান্য পার্সেলের স্ট্যাটাস চেক করা
          const sameDayRows: any = await query(`SELECT status, courierStatus, invoice FROM orders WHERE DATE(dateSent) = ? OR DATE(dateCreated) = ?`, [queryDateStr, queryDateStr]);
          
          let sameDayTotal = 0; let sameDayPending = 0; let sameDayDelivered = 0; let sameDayReturned = 0;
          const pendingList: string[] = [];

          if (Array.isArray(sameDayRows)) {
            sameDayTotal = sameDayRows.length;
            sameDayRows.forEach(r => {
              const cs = (r.courierStatus || '').toLowerCase();
              if (cs === 'delivered' || cs === 'partial_delivered') sameDayDelivered++;
              else if (['cancelled', 'returned', 'return', 'cancelled_approval_pending'].includes(cs)) sameDayReturned++;
              else {
                sameDayPending++;
                if (String(r.invoice) !== String(invoice)) pendingList.push(`#${r.invoice}`);
              }
            });
          }

          const fullAddress = `${dbOrder.address || ''}, ${dbOrder.thana || ''}, ${dbOrder.district || ''}`.replace(/,\s*,/g, ',').trim();
          
          tgMessage = `🎉 <b>DELIVERY COMPLETED</b> 🎉\n`;
          tgMessage += `-----------------------------------\n`;
          tgMessage += `🧾 <b>ইনভয়েস: #${dbOrder.invoice}</b>\n`;
          tgMessage += `🔖 <b>CID:</b> <code>${consignmentId || trackingCode}</code>\n`;
          tgMessage += `📅 [পাঠানো: ${orderDateStr} / ডেলিভারি: ${delvDateStr}]\n\n`;
          
          tgMessage += `👤 <b>কাস্টমার:</b> ${dbOrder.customer_name || customerName}\n`;
          tgMessage += `📱 <b>মোবাইল:</b> <code>${dbOrder.phone || 'N/A'}</code>\n`;
          tgMessage += `📍 <b>ঠিকানা:</b> ${fullAddress || address}\n`;
          tgMessage += `📦 <b>আইটেম:</b> ${dbOrder.items} ${dbOrder.size ? `[সাইজ: ${dbOrder.size}]` : ''}\n`;
          tgMessage += `💰 <b>COD:</b> ৳${dbOrder.total}\n`;
          tgMessage += `-----------------------------------\n`;

          if (sameDayPending > 0) {
            tgMessage += `⚠️ <b>নজর দিন:</b> ${orderDateStr} তারিখে পাঠানো মোট ${sameDayTotal} টি পার্সেলের মধ্যে এখনো <b>${sameDayPending} টি পার্সেল পেন্ডিং</b> আছে।\n`;
            if (pendingList.length > 0) tgMessage += `<i>(পেন্ডিং ইনভয়েস: ${pendingList.join(', ')})</i>\n`;
          } else {
            tgMessage += `✅ <b>দুর্দান্ত!</b> ${orderDateStr} তারিখে পাঠানো সকল পার্সেলের ফয়সালা হয়ে গেছে (কোনো পেন্ডিং নেই)।\n`;
          }
          tgMessage += `📊 <i>সামারি: মোট: ${sameDayTotal} | ডেলিভারি: ${sameDayDelivered} | রিটার্ন: ${sameDayReturned} | পেন্ডিং: ${sameDayPending}</i>`;
        }
      } catch (err) {}
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
        body: JSON.stringify({ chat_id: groupCourier, text: tgMessage, parse_mode: 'HTML' }),
      });
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, warning: error.message }, { status: 200 });
  }
}