import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'জিমেইল ঠিকানা লিখুন' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // অনুমোদিত তালিকা যাচাই
    const allowedEnv = process.env.ALLOWED_EMAILS || '';
    const allowedList = allowedEnv
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!allowedList.includes(cleanEmail)) {
      return NextResponse.json(
        { error: '❌ এই জিমেইলটি আমাদের অনুমোদিত তালিকায় নেই! অ্যাডমিনের সাথে যোগাযোগ করুন।' },
        { status: 403 }
      );
    }

    // অনুমোদিত জিমেইল হলে সফল মেসেজ
    return NextResponse.json({
      success: true,
      message: `ভেরিফাইড জিমেইল (${cleanEmail})-এ পাসওয়ার্ড রিসেট লিঙ্ক জেনারেট করা হয়েছে। অ্যাডমিনের সাথে সাময়িক মাস্টার পাসওয়ার্ড কনফার্ম করুন।`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'সার্ভার সমস্যা হয়েছে' }, { status: 500 });
  }
}