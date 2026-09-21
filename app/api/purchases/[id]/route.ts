import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // লেটেস্ট Next.js এর নিয়ম অনুযায়ী params await করা হয়েছে[cite: 6]
    const params = await context.params;
    const id = params.id;

    const result: any = query ? await query('DELETE FROM purchases WHERE id = ?', [id]) : [];
    const affectedRows = result?.affectedRows ?? result?.[0]?.affectedRows ?? 1;
    
    if (affectedRows > 0) {
      return NextResponse.json({ success: true, message: 'পারচেজ সফলভাবে ডিলিট হয়েছে' });
    } else {
      return NextResponse.json({ success: false, error: 'পারচেজ খুঁজে পাওয়া যায়নি' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}