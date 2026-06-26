import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const db = await getDb();
    
    const record = await db.get(`SELECT * FROM TicketOTP WHERE email = ?`, [email]);

    if (!record) {
      return NextResponse.json({ error: 'No OTP requested for this email' }, { status: 400 });
    }

    if (record.otpCode !== otp.trim()) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(record.expiresAt);

    if (now > expiresAt) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Mark as verified
    await db.run(`UPDATE TicketOTP SET verified = 1 WHERE email = ?`, [email]);

    return NextResponse.json({ success: true, message: 'OTP verified successfully' });
  } catch (error: any) {
    console.error('OTP Verify Error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
