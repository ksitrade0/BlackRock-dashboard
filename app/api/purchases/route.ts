import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const [result]: any = await query('DELETE FROM purchases WHERE id = ?', [id]);
    
    if (result.affectedRows > 0) {
      return NextResponse.json({ success: true, message: 'পারচেজ সফলভাবে ডিলিট হয়েছে' });
    } else {
      return NextResponse.json({ success: false, error: 'পারচেজ খুঁজে পাওয়া যায়নি' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}