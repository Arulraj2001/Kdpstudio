import { sendContactFormEmail } from '../../../lib/emailService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body || {};

    if (!email || !message) {
      return new Response(
        JSON.stringify({ error: 'Email and message are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fromName = name || 'Anonymous User';
    const fromEmail = email;
    const subj = subject || 'General Inquiry';
    const msg = message;

    // Send contact form email to administrator
    sendContactFormEmail({
      fromName,
      fromEmail,
      subject: subj,
      message: msg,
      timestamp: new Date().toISOString(),
    }).catch(console.error);

    return new Response(
      JSON.stringify({ success: true, message: 'Message sent successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[API contact] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to submit contact form' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
