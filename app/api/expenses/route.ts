import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // টেবিল না থাকলে অটোমেটিক তৈরি করবে
    await query(`CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY, 
      date VARCHAR(50), 
      description TEXT, 
      spender VARCHAR(100), 
      amount DECIMAL(10,2), 
      createdBy VARCHAR(100), 
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    
    const rows = await query('SELECT * FROM expenses ORDER BY date DESC, id DESC');
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { date, description, spender, amount, createdBy } = await req.json();
    
    await query(`CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY, 
      date VARCHAR(50), 
      description TEXT, 
      spender VARCHAR(100), 
      amount DECIMAL(10,2), 
      createdBy VARCHAR(100), 
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    
    await query(
      'INSERT INTO expenses (date, description, spender, amount, createdBy) VALUES (?, ?, ?, ?, ?)',
      [date, description, spender, amount, createdBy]
    );
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (id) {
      await query('DELETE FROM expenses WHERE id = ?', [id]);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: 'ID not found' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}