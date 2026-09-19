import { NextResponse } from 'next/server';

// অনুমোদিত জিমেইল এবং সুনির্দিষ্ট স্টাফ নামের ম্যাপিং
const AUTHORIZED_STAFF_MAP: Record<string, string> = {
  'ksitrade0@gmail.com': 'omar faruque(Admin)',
  'awlad4197@gmail.com': 'Awlad Hossain',
  'hmsakib685@gmail.com': 'Emdadullah Sakib',
};

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'জিমেইল এবং পাসওয়ার্ড প্রদান করুন' }, { status: 400 });
    }

    const cleanEmail = username.trim().toLowerCase();

    // ১. অনুমোদিত জিমেইল যাচাই
    const matchedDisplayName = AUTHORIZED_STAFF_MAP[cleanEmail];
    if (!matchedDisplayName) {
      return NextResponse.json(
        { error: '❌ এই জিমেইলটি অ্যাক্সেস অনুমোদিত নয়! অ্যাডমিনের সাথে যোগাযোগ করুন।' },
        { status: 403 }
      );
    }

    // ২. পাসওয়ার্ড যাচাই
    const validPassword = process.env.ADMIN_PASSWORD || 'BlackRock@2026';
    if (password !== validPassword) {
      return NextResponse.json({ error: 'ভুল পাসওয়ার্ড!' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      username: matchedDisplayName,
      email: cleanEmail,
    });

    // সেশন টোকেন কুকি (৭ দিনের জন্য)
    response.cookies.set('admin_session', 'authenticated_blackrock_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 1,
      path: '/',
    });

    // ড্যাশবোর্ডের হেডারে প্রদর্শনের জন্য নাম
    response.cookies.set('admin_user_name', encodeURIComponent(matchedDisplayName), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 1,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'সার্ভার সমস্যা হয়েছে' }, { status: 500 });
  }
}