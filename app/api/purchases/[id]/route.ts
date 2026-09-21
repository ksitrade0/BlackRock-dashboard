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

    // সরাসরি ডিলিট কুয়েরি রান করা (কোনো অতিরিক্ত অবজেক্ট স্ট্রাকচার চেক ছাড়া)
    await query('DELETE FROM purchases WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true, message: 'পারচেজ সফলভাবে ডিলিট হয়েছে' });
  } catch (error: any) {
    console.error('Delete Purchase Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}