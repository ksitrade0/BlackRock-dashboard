import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    await query(`CREATE TABLE IF NOT EXISTS activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(100),
      details TEXT,
      performed_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    const rows = await query('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 500');
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const { action, details, performed_by } = await req.json();
    await query(`CREATE TABLE IF NOT EXISTS activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(100),
      details TEXT,
      performed_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await query('INSERT INTO activity_logs (action, details, performed_by) VALUES (?, ?, ?)', [action, details, performed_by]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}