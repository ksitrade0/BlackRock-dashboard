import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  const userNameCookie = cookieStore.get('admin_user_name');

  if (session?.value === 'authenticated_blackrock_token') {
    const displayName = userNameCookie?.value
      ? decodeURIComponent(userNameCookie.value)
      : 'Admin';

    return NextResponse.json({
      authenticated: true,
      username: displayName,
    });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}