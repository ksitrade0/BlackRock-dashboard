import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, type } = await req.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8985282113:AAHpocozZnhC8Eog9pS1rXCCmTDf_QHsyu4';
    const groupOrders = process.env.TELEGRAM_ORDERS_GROUP_ID || '-1004425589317';
    const groupActivity = process.env.TELEGRAM_ACTIVITY_GROUP_ID || '-1004468510663';
    
    // আপনার নতুন RUHAMA COURIER ALERTS ৩য় গ্রুপের Chat ID
    const groupCourier = process.env.TELEGRAM_COURIER_GROUP_ID || '-5518408506';

    let targetChatId = groupOrders;
    if (type === 'courier') {
      targetChatId = groupCourier;
    } else if (type === 'activity') {
      targetChatId = groupActivity;
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const data = await tgRes.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}