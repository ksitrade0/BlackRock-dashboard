import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json({ success: false, error: 'আইডি পাওয়া যায়নি' }, { status: 400 });
    }

    // ডাইরেক্ট ডিলিট কুয়েরি
    await query('DELETE FROM purchases WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true, message: 'পারচেজ সফলভাবে ডিলিট হয়েছে' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}