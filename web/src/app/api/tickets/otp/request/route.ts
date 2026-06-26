import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const db = await getDb();
    
    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Upsert into TicketOTP
    await db.run(`
      INSERT INTO TicketOTP (email, otpCode, expiresAt, verified)
      VALUES (?, ?, ?, 0)
      ON CONFLICT(email) DO UPDATE SET
        otpCode = excluded.otpCode,
        expiresAt = excluded.expiresAt,
        verified = 0
    `, [email, otpCode, expiresAt]);

    // Get SMTP Configuration from Settings table
    const settingsRows = await db.all(`SELECT key, value FROM Settings WHERE key IN ('smtpHost', 'smtpPort', 'smtpUser', 'smtpPass')`);
    const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {}) as any;

    const SMTP_HOST = settings.smtpHost?.trim();
    const SMTP_PORT = settings.smtpPort?.trim();
    const SMTP_USER = settings.smtpUser?.trim();
    const SMTP_PASS = settings.smtpPass?.trim();

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
        logger: true,
        debug: true, // show full SMTP traffic
      });

      await transporter.sendMail({
        from: SMTP_USER, // Removed "IT Helpdesk" to prevent phishing filters
        to: email,
        subject: 'ITAM - OTP Verification',
        text: `Your OTP for submitting an IT Helpdesk ticket is: ${otpCode}\n\nThis code will expire in 10 minutes.`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 40px 20px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
              
              <!-- Header -->
              <div style="background-color: #0f766e; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">IT SUPPORT</h1>
              </div>

              <!-- Body -->
              <div style="padding: 40px 30px; text-align: center;">
                <h2 style="color: #333333; margin-top: 0; font-size: 20px; font-weight: 600;">Verification Code</h2>
                <p style="color: #666666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                  You requested a One-Time Password (OTP) to submit an IT ticket. Please use the verification code below to proceed.
                </p>

                <!-- OTP Box -->
                <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin: 0 auto; max-width: 300px;">
                  <h1 style="color: #0f766e; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0; font-family: 'Courier New', Courier, monospace;">${otpCode}</h1>
                </div>

                <p style="color: #ef4444; font-size: 14px; font-weight: 500; margin-top: 30px;">
                  ⏰ This code will expire in 10 minutes.
                </p>
              </div>

              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #eaeaea;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  If you did not request this code, please ignore this email.<br>
                  &copy; ${new Date().getFullYear()} IT Asset Management System.
                </p>
              </div>

            </div>
          </div>
        `
      });
    } else {
      // DUMMY MODE FOR TESTING
      console.log('----------------------------------------------------');
      console.log(`[DUMMY OTP EMAIL] To: ${email}`);
      console.log(`[DUMMY OTP EMAIL] Code: ${otpCode}`);
      console.log('[WARNING] Real OTP not sent because SMTP settings are incomplete in the Database.');
      console.log('----------------------------------------------------');
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('OTP Request Error:', error);
    return NextResponse.json({ error: 'Failed to request OTP' }, { status: 500 });
  }
}
