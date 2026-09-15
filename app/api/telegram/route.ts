import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, type = 'activity' } = await req.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8985282113:AAHpocozZnhC8Eog9pS1rXCCmTDf_QHsyu4';
    
    // Group 1: New Orders | Group 2: Dashboard Operations
    const orderChatId = process.env.TELEGRAM_ORDERS_CHAT_ID || '-1004425589317';
    const activityChatId = process.env.TELEGRAM_ACTIVITY_CHAT_ID || '-1004468510663';

    const targetChatId = type === 'order' ? orderChatId : activityChatId;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const res = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json();
    return NextResponse.json({ success: data.ok, data });
  } catch (error: any) {
    console.error('Telegram API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}