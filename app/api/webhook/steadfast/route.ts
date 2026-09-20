import { NextResponse } from 'next/server';

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

    let tgMessage = '';

    if (status === 'delivered') {
      let customerName = 'সম্মানিত কাস্টমার';
      let address = 'ঠিকানা পাওয়া যায়নি';
      let items = 'বিস্তারিত ড্যাশবোর্ডে দেখুন';
      let orderDate = 'N/A';
      let pendingText = '';

      try {
        const dashRes = await fetch('https://app.ruhamar.com/api/orders');
        
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          if (dashData && Array.isArray(dashData.orders)) {
            
            const matchedOrder = dashData.orders.find((o: any) => 
              String(o.invoice) === String(invoice) || String(o.consignmentId) === String(consignmentId)
            );

            if (matchedOrder) {
              customerName = matchedOrder.customerName || customerName;
              
              const addrParts = [
                matchedOrder.streetAddress || matchedOrder.address || '', 
                matchedOrder.thana ? `Thana: ${matchedOrder.thana}` : '', 
                matchedOrder.district ? `District: ${matchedOrder.district}` : ''
              ].filter(Boolean);
              address = addrParts.join(', ') || address;
              
              items = matchedOrder.items || 'N/A';
              if (matchedOrder.size) items += ` [সাইজ: ${matchedOrder.size}]`;

              if (matchedOrder.dateCreated) {
                const d = new Date(matchedOrder.dateCreated);
                orderDate = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
                
                const todayStr = d.toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' });

                // ওই তারিখের বাকি পেন্ডিং পার্সেল বের করা (বর্তমান ডেলিভারি হওয়াটি বাদে)
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
                
                // পেন্ডিং পার্সেল থাকলে সেগুলোর বিস্তারিত তথ্য লিস্ট করা
                if (pendingOrders.length > 0) {
                  pendingText = `আপনার ${orderDate} তারিখের আরও <b>${pendingOrders.length}টি</b> পার্সেল পেন্ডিং আছে:\n\n`;
                  pendingOrders.forEach((pO: any, index: number) => {
                    const pName = pO.customerName || 'N/A';
                    const pAddrParts = [
                      pO.streetAddress || pO.address || '', 
                      pO.thana ? `Thana: ${pO.thana}` : '', 
                      pO.district ? `District: ${pO.district}` : ''
                    ].filter(Boolean);
                    const pAddress = pAddrParts.join(', ') || 'N/A';
                    let pItems = pO.items || 'N/A';
                    if (pO.size) pItems += ` [সাইজ: ${pO.size}]`;
                    const pCid = pO.consignmentId || pO.trackingCode || 'N/A';
                    
                    pendingText += `⚠️ <b>পেন্ডিং পার্সেল ${index + 1}:</b>\n`;
                    pendingText += `🧾 <b>ইনভয়েস / CID:</b> #${pO.invoice} / <code>${pCid}</code>\n`;
                    pendingText += `📅 <b>তারিখ:</b> ${orderDate}\n`;
                    pendingText += `👤 <b>নাম:</b> ${pName}\n`;
                    pendingText += `📍 <b>ঠিকানা:</b> ${pAddress}\n`;
                    pendingText += `📦 <b>আইটেম:</b> ${pItems}\n`;
                    if (index < pendingOrders.length - 1) pendingText += `-----------------------\n`;
                  });
                } else {
                  pendingText = `আপনার ${orderDate} তারিখের আর কোন পার্সেল পেন্ডিং নাই।`;
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Dashboard Fetch Error inside Webhook:", err);
      }

      // ব্যাকআপ API 
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
            if (stData.delivery_status.created_at && orderDate === 'N/A') {
              const cDate = new Date(stData.delivery_status.created_at);
              orderDate = `${cDate.getDate()}/${cDate.getMonth() + 1}/${cDate.getFullYear().toString().slice(-2)}`;
            }
          }
        } catch (e) {}
      }

      const today = new Date();
      const deliveryDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear().toString().slice(-2)}`;

      if (!pendingText) {
         pendingText = `আপনার ${orderDate} তারিখের আর কোন পার্সেল পেন্ডিং নাই।`;
      }

      tgMessage = 
        `✅ <b>আজকে ডেলিভারি হওয়া আপনার পার্সেল সম্পূর্ণভাবে ডেলিভারি হয়েছে।</b>\n\n` +
        `🧾 <b>ইনভয়েস / CID:</b> #${invoice} / <code>${consignmentId}</code>\n` +
        `📅 <b>তারিখ:</b> ${orderDate} = ${deliveryDate}\n\n` +
        `👤 <b>নাম:</b> ${customerName}\n` +
        `📍 <b>ঠিকানা:</b> ${address}\n` +
        `📦 <b>আইটেম:</b> ${items}\n\n` +
        `⏳ <b>পেন্ডিং আপডেট:</b>\n${pendingText}`;

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