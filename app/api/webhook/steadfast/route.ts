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

    let storeName = 'Ruhama Wear';
    let customerName = 'সম্মানিত কাস্টমার';
    let customerPhone = 'N/A';
    let address = 'ঠিকানা পাওয়া যায়নি';
    let items = 'বিস্তারিত ড্যাশবোর্ডে দেখুন ঠিক আছে';
    let orderTotal = '0';
    let orderDate = 'N/A';
    let pendingText = '';
    let tgMessage = '';

    const escapeHtml = (str: any) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
        customerPhone = dbOrder.phone || customerPhone;
        address = dbOrder.address || address;
        items = dbOrder.items || items;
        orderTotal = dbOrder.total || orderTotal;
        storeName = String(storeId || '').toLowerCase().includes('aastha') ? 'Aastha Naturals BD' : 'Ruhama Wear';

        let newWooStatus = '';
        if (status === 'delivered' || status === 'partial_delivered') newWooStatus = 'completed';
        else if (status === 'cancelled' || status === 'returned' || status === 'return' || status === 'cancelled_approval_pending') newWooStatus = 'cancelled';

        let url = '';
        let key = '';
        let secret = '';
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

          const updatePayload: any = { 
            meta_data: [{ key: 'courierStatus', value: status }] 
          };
          if (newWooStatus) {
            updatePayload.status = newWooStatus;
          }

          await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: authHeader,
            },
            body: JSON.stringify(updatePayload),
          }).catch(() => {});
        }

        if (newWooStatus) {
           await query(
             `UPDATE orders SET status = ? WHERE id = ?`,
             [newWooStatus, orderId]
           );
        }

        if (newWooStatus === 'completed') {
            const PIXEL_ID = '1407475261571485';
            const ACCESS_TOKEN = 'EAAZBgIMx3nh0BSYfDyK54YtwjU7ejlxU0TrAc8tpakyOVPEatBs7kSOJKpnSlk06hoIZAaTxdfyUtOF7thgIUfifFAmvNQbUkEUpC2NakeRKZCSnlhCYPN5P4fXnn743W5xvOO9JohVloRjr2llm0Dh3k0fqp0ZByINexW9BbMh9VQgMP5kcZBG1oqDWuuQZDZD';
            
            const numTotal = parseFloat(orderTotal || '0');
            const hashData = (data: string) => {
                if (!data) return '';
                return crypto.createHash('sha256').update(data.replace(/[^0-9]/g, '')).digest('hex');
            };

            const capiPayload = {
                data: [
                    {
                        event_name: 'Purchase',
                        event_time: Math.floor(Date.now() / 1000),
                        action_source: 'website',
                        event_id: orderId.toString(),
                        user_data: {
                            ph: customerPhone ? [hashData(customerPhone)] : []
                        },
                        custom_data: {
                            currency: 'BDT',
                            value: numTotal
                        }
                    }
                ]
            };

            try {
                await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(capiPayload)
                });
            } catch (capiErr) {}
        }
      }
    } catch (dbErr) {}

    // =======================================================
    // ২. টেলিগ্রাম নোটিফিকেশন লজিক (আপনার চাহিদামতো সাজানো ফরম্যাট)
    // =======================================================
    if (status === 'delivered') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); 
        const dashRes = await fetch('https://app.ruhamawear.com/api/orders', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          if (dashData && Array.isArray(dashData.orders)) {
            const matchedOrder = dashData.orders.find((o: any) => 
              String(o.invoice) === String(invoice) || String(o.consignmentId) === String(consignmentId)
            );

            if (matchedOrder) {
              customerName = matchedOrder.customerName || customerName;
              customerPhone = matchedOrder.phone || customerPhone;
              const addrParts = [matchedOrder.streetAddress || matchedOrder.address, matchedOrder.thana ? `Thana: ${matchedOrder.thana}` : '', matchedOrder.district ? `District: ${matchedOrder.district}` : ''].filter(Boolean);
              address = addrParts.join(', ') || address;
              items = matchedOrder.items || items;
              orderTotal = matchedOrder.total || orderTotal;
              storeName = matchedOrder.storeName || storeName;

              if (matchedOrder.dateCreated) {
                const d = new Date(matchedOrder.dateCreated);
                orderDate = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
                const todayStr = d.toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' });

                let sameDayTotal = 0;
                let sameDayDelivered = 0;
                let sameDayReturned = 0;
                let sameDayPendingCount = 0;

                dashData.orders.forEach((o: any) => {
                  if (o.dateCreated && new Date(o.dateCreated).toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' }) === todayStr) {
                    sameDayTotal++;
                    const oStatus = (o.courierStatus || '').toLowerCase();
                    const wStatus = (o.status || '').toLowerCase();

                    if (wStatus === 'completed' || oStatus === 'delivered' || oStatus === 'partial_delivered') {
                      sameDayDelivered++;
                    } else if (['cancelled', 'failed'].includes(wStatus) || ['cancelled', 'returned', 'return', 'cancelled_approval_pending'].includes(oStatus)) {
                      sameDayReturned++;
                    } else if (o.trackingCode || o.consignmentId) {
                      sameDayPendingCount++;
                    }
                  }
                });

                const pendingOrders = dashData.orders.filter((o: any) => {
                  if (!o.dateCreated) return false;
                  const oDate = new Date(o.dateCreated).toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' });
                  const oStatus = (o.courierStatus || '').toLowerCase();
                  
                  const isPending = (o.trackingCode || o.consignmentId) && 
                                    o.status !== 'completed' && 
                                    o.status !== 'cancelled' &&
                                    oStatus !== 'delivered' &&
                                    oStatus !== 'returned' &&
                                    oStatus !== 'cancelled' &&
                                    oStatus !== 'return';
                  return oDate === todayStr && isPending && String(o.invoice) !== String(invoice);
                });
                
                if (pendingOrders.length > 0) {
                  pendingText = `আপনার ${orderDate} তারিখের আরও <b>${pendingOrders.length}টি</b> পার্সেল পেন্ডিং আছে:\n\n`;
                  pendingOrders.forEach((pO: any, index: number) => {
                    const pName = pO.customerName || 'N/A';
                    const pPhone = pO.phone || 'N/A';
                    const pAddrParts = [pO.streetAddress || pO.address || '', pO.thana ? `Thana: ${pO.thana}` : '', pO.district ? `District: ${pO.district}` : ''].filter(Boolean);
                    const pAddress = pAddrParts.join(', ') || 'N/A';
                    const pItems = pO.items || 'N/A';
                    const pTotal = pO.total || '0';
                    const pCid = pO.consignmentId || pO.trackingCode || 'N/A';
                    
                    pendingText += `⚠️ <b>পেন্ডিং পার্সেল ${index + 1}:</b>\n`;
                    pendingText += `🏬 <b>স্টোর:</b> ${escapeHtml(pO.storeName || 'Ruhama Wear')}\n`;
                    pendingText += `🧾 <b>ইনভয়েস / CID:</b> #${escapeHtml(pO.invoice)} / <code>${escapeHtml(pCid)}</code>\n`;
                    pendingText += `👤 <b>কাস্টমার:</b> ${escapeHtml(pName)}\n`;
                    pendingText += `📞 <b>মোবাইল:</b> <code>${escapeHtml(pPhone)}</code>\n`;
                    pendingText += `📍 <b>ঠিকানা:</b> ${escapeHtml(pAddress)}\n`;
                    pendingText += `📦 <b>আইটেম:</b> ${escapeHtml(pItems)}\n`;
                    pendingText += `💰 <b>টাকা (COD):</b> ৳ ${escapeHtml(pTotal)}\n`;
                    pendingText += `📌 <b>স্ট্যাটাস:</b> <code>PENDING</code>\n`;
                    if (index < pendingOrders.length - 1) pendingText += `-----------------------\n`;
                  });
                } else {
                  pendingText = `আপনার ${orderDate} তারিখের আর কোন পার্সেল পেন্ডিং নাই।`;
                }

                if (sameDayTotal > 0) {
                  pendingText += `\n\n📊 <i>সামারি (${orderDate}): মোট: ${sameDayTotal} | ডেলিভারি: ${sameDayDelivered} | রিটার্ন: ${sameDayReturned} | পেন্ডিং: ${sameDayPendingCount}</i>`;
                }
              }
            }
          }
        }
      } catch (err) {}

      if (customerName === 'সম্মানিত কাস্টমার' && consignmentId) {
        try {
          const apiKey = process.env.STEADFAST_API_KEY || 'n5wjg5pat2seuxiiz1mmw7evsl1ehzuw';
          const secretKey = process.env.STEADFAST_SECRET_KEY || 'jv5elbxxof0qxlshgnf2mpwv';
          const stRes = await fetch(`https://portal.packzy.com/api/v1/status_by_cid/${consignmentId}`, {
            headers: { 'Api-Key': apiKey, 'Secret-Key': secretKey }
          });
          const stData = await stRes.json();
          if (stData && stData.delivery_status) {
            customerName = stData.delivery_status.recipient_name || customerName;
            address = stData.delivery_status.recipient_address || address;
            customerPhone = stData.delivery_status.recipient_phone || customerPhone;
          }
        } catch (e) {}
      }

      // আপনার কথামতো সাজানো ফুল ডিটেইলস ফরম্যাট (স্টোর, ইনভয়েস, কাস্টমার, মোবাইল, ঠিকানা, আইটেম, টাকা, স্ট্যাটাস)
      tgMessage = 
        `✅ <b>পার্সেল সফলভাবে ডেলিভারি হয়েছে।</b>\n\n` +
        `🏬 <b>স্টোর:</b> ${escapeHtml(storeName)}\n` +
        `🧾 <b>ইনভয়েস / CID:</b> #${escapeHtml(invoice)} / <code>${escapeHtml(consignmentId)}</code>\n` +
        `👤 <b>কাস্টমার:</b> ${escapeHtml(customerName)}\n` +
        `📞 <b>মোবাইল:</b> <code>${escapeHtml(customerPhone)}</code>\n` +
        `📍 <b>ঠিকানা:</b> ${escapeHtml(address)}\n` +
        `📦 <b>আইটেম:</b> ${escapeHtml(items)}\n` +
        `💰 <b>টাকা (COD):</b> ৳ ${escapeHtml(orderTotal)}\n` +
        `📌 <b>স্ট্যাটাস:</b> <code>DELIVERED</code>\n\n` +
        `⏳ <b>পেন্ডিং আপডেট:</b>\n${pendingText}`;

    } 
    else if (status === 'cancelled' || status === 'partial_delivered') {
      tgMessage = `❌ <b>পার্সেল রিটার্ন / আংশিক ডেলিভারি!</b>\n` +
        `🏬 <b>স্টোর:</b> ${escapeHtml(storeName)}\n` +
        `🧾 <b>ইনভয়েস / CID:</b> #${escapeHtml(invoice)} / <code>${escapeHtml(consignmentId)}</code>\n` +
        `👤 <b>কাস্টমার:</b> ${escapeHtml(customerName)}\n` +
        `📞 <b>মোবাইল:</b> <code>${escapeHtml(customerPhone)}</code>\n` +
        `📍 <b>ঠিকানা:</b> ${escapeHtml(address)}\n` +
        `📦 <b>আইটেম:</b> ${escapeHtml(items)}\n` +
        `💰 <b>টাকা (COD):</b> ৳ ${escapeHtml(orderTotal)}\n` +
        `📌 <b>স্ট্যাটাস:</b> <code>${escapeHtml(status.toUpperCase())}</code>\n` +
        `${note ? `• <b>কারণ / নোট:</b> <i>${escapeHtml(note)}</i>\n` : ''}`;
    } 
    else if (note || riderName) {
      tgMessage = `⚠️ <b>রাইডার আপডেট / বিশেষ নোট</b>\n` +
        `-----------------------\n` +
        `🏬 <b>স্টোর:</b> ${escapeHtml(storeName)}\n` +
        `🧾 <b>ইনভয়েস / CID:</b> #${escapeHtml(invoice)} / <code>${escapeHtml(consignmentId)}</code>\n` +
        `👤 <b>কাস্টমার:</b> ${escapeHtml(customerName)}\n` +
        `📞 <b>মোবাইল:</b> <code>${escapeHtml(customerPhone)}</code>\n` +
        `📍 <b>ঠিকানা:</b> ${escapeHtml(address)}\n` +
        `📦 <b>আইটেম:</b> ${escapeHtml(items)}\n` +
        `💰 <b>টাকা (COD):</b> ৳ ${escapeHtml(orderTotal)}\n` +
        `📌 <b>স্ট্যাটাস:</b> <code>${escapeHtml(status.toUpperCase() || 'IN TRANSIT')}</code>\n` +
        `${riderName ? `• <b>রাইডার:</b> ${escapeHtml(riderName)} (${escapeHtml(riderPhone)})\n` : ''}` +
        `• <b>রাইডারের নোট:</b> <b>${escapeHtml(note || 'কোনো নোট দেওয়া হয়নি সংযোগ')}</b>`;
    }

    if (tgMessage) {
      const sendTelegram = async (textMsg: string) => {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        if (textMsg.length > 3500) {
          const parts = textMsg.match(/[\s\S]{1,3500}/g) || [];
          for (const part of parts) {
            await fetch(url, { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ chat_id: groupCourier, text: part, parse_mode: 'HTML' }) 
            });
            await new Promise(r => setTimeout(r, 1000));
          }
        } else {
          await fetch(url, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ chat_id: groupCourier, text: textMsg, parse_mode: 'HTML' }) 
          });
        }
      };
      
      await sendTelegram(tgMessage);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, warning: error.message }, { status: 200 });
  }
}