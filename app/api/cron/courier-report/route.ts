import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user') || 'System Auto Cron';

    const apiKey = (process.env.STEADFAST_API_KEY || process.env.STEADFAST_KEY || '').trim();
    const secretKey = (process.env.STEADFAST_SECRET_KEY || process.env.STEADFAST_SECRET || '').trim();
    const todayStr = new Date().toISOString().split('T')[0];

    const logFilePath = path.join(process.cwd(), 'sent_parcels.json');
    let allLogs: any[] = [];
    try {
      if (fs.existsSync(logFilePath)) {
        allLogs = JSON.parse(fs.readFileSync(logFilePath, 'utf-8'));
      }
    } catch (e) {
      console.error('Error reading sent_parcels.json:', e);
    }

    // শেষ ৩০টি পার্সেল নিবো যাতে API টাইমআউট না হয়
    const recentLogs = allLogs.slice(-30);

    let reportItems: any[] = [];
    let totalCod = 0;

    for (let i = 0; i < recentLogs.length; i++) {
      const item = recentLogs[i];
      let liveStatus = 'IN_REVIEW';

      if (apiKey && secretKey) {
          try {
            const endpoints = [
              `https://portal.packzy.com/api/v1/status_by_cid/${item.cid}`,
              `https://portal.steadfast.com.bd/api/v1/status_by_cid/${item.cid}`
            ];

            for (const url of endpoints) {
              const stRes = await fetch(url, {
                method: 'GET',
                headers: { 'Api-Key': apiKey, 'Secret-Key': secretKey, 'Content-Type': 'application/json' },
              });
              const stJson = await stRes.json();
              if (stRes.ok && (stJson.status === 200 || stJson.delivery_status || stJson.status)) {
                liveStatus = (stJson.delivery_status || stJson.status || 'in_review').toUpperCase();
                break;
              }
            }
          } catch (err) {}
      }

      const isToday = item.date === todayStr;
      // যেসব স্ট্যাটাস মানে পার্সেলের কাজ শেষ (ডেলিভার্ড, রিটার্ন, ক্যান্সেল)
      const isTerminal = ['DELIVERED', 'RETURNED', 'CANCELLED'].includes(liveStatus);

      // যদি আজকের পার্সেল হয় অথবা এখনো পেন্ডিং থাকে, তবেই রিপোর্টে আসবে
      if (isToday || !isTerminal) {
        reportItems.push({ ...item, liveStatus });
        totalCod += Number(item.cod || 0);
      }
    }

    let summaryText = `📊 <b>RUHAMA WEAR - COURIER AUDIT REPORT</b>\n`;
    summaryText += `━━━━━━━━━━━━━━━━━━━\n`;
    summaryText += `📅 <b>তারিখ:</b> ${todayStr}\n`;
    summaryText += `👤 <b>জেনারেট করেছেন:</b> ${user}\n`;
    summaryText += `📦 <b>অ্যাক্টিভ ও পেন্ডিং পার্সেল:</b> ${reportItems.length}টি\n\n`;

    if (reportItems.length === 0) {
      summaryText += `⚠️ আজ কোনো নতুন পার্সেল নেই এবং পুরনো কোনো পেন্ডিং পার্সেল নেই।\n`;
    } else {
      for (let i = 0; i < reportItems.length; i++) {
        const item = reportItems[i];
        const dateBadge = item.date === todayStr ? '🆕 আজ' : '⏳ পেন্ডিং';
        
        summaryText += `${i + 1}. <b>Inv:</b> #${item.invoice} [${dateBadge}]\n`;
        summaryText += `   🚚 CID: <code>${item.cid}</code>\n`;
        summaryText += `   👤 ${item.customerName} (<code>${item.phone}</code>)\n`;
        summaryText += `   💵 COD: ৳${item.cod} | St: <code>${item.liveStatus}</code>\n\n`;
      }
    }

    summaryText += `━━━━━━━━━━━━━━━━━━━\n`;
    summaryText += `💰 <b>মোট ক্যাশ কালেকশন (COD):</b> ৳${totalCod}\n`;

    // সরাসরি লাইভ ডোমেইনে রিকোয়েস্ট
    const tgRes = await fetch('https://app.ruhamawear.com/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: summaryText, type: 'courier' }),
    });

    if (!tgRes.ok) {
       return NextResponse.json({ error: 'Failed to send message via telegram API' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Audit report sent successfully!', count: reportItems.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}